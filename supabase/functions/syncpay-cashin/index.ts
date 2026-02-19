import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYNCPAY_BASE = "https://api.syncpayments.com.br";

async function getSyncPayToken(): Promise<string> {
  const clientId = Deno.env.get("SYNCPAY_CLIENT_ID")!;
  const clientSecret = Deno.env.get("SYNCPAY_CLIENT_SECRET")!;

  const res = await fetch(`${SYNCPAY_BASE}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SyncPay auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // SyncPay returns { access_token: "...", ... }
  return data.access_token ?? data.token ?? data.data?.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fanId = claimsData.claims.sub;
    const fanEmail = claimsData.claims.email as string;

    const body = await req.json();
    const { creator_id, plan_name, amount, fan_name, fan_cpf, creator_name } =
      body;

    if (!creator_id || !plan_name || !amount || !fan_name || !fan_cpf) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get SyncPay bearer token
    const syncpayToken = await getSyncPayToken();

    // Build webhook URL
    const projectId = Deno.env.get("SUPABASE_URL")!.split(".")[0].split("//")[1];
    const webhookUrl = `https://${projectId}.supabase.co/functions/v1/syncpay-webhook`;

    // Generate Pix charge
    const amountInCents = Math.round(Number(amount) * 100);
    const cpfClean = String(fan_cpf).replace(/\D/g, "");

    const cashInPayload = {
      amount: amountInCents,
      description: `Assinatura ${creator_name ?? "Criador"} - Plano ${plan_name}`,
      webhook_url: webhookUrl,
      client: {
        name: fan_name,
        cpf: cpfClean,
        email: fanEmail,
      },
      metadata: {
        fan_id: fanId,
        creator_id,
        plan: plan_name,
        amount,
      },
    };

    console.log("SyncPay cash-in payload:", JSON.stringify({ ...cashInPayload, client: { ...cashInPayload.client, document: cpfClean.slice(0, 3) + "***" } }));

    const cashInRes = await fetch(`${SYNCPAY_BASE}/api/partner/v1/cash-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${syncpayToken}`,
      },
      body: JSON.stringify(cashInPayload),
    });

    const contentType = cashInRes.headers.get("content-type") ?? "";
    console.log("SyncPay cash-in status:", cashInRes.status, "content-type:", contentType);

    if (!cashInRes.ok) {
      let detail: string;
      if (contentType.includes("application/json")) {
        try {
          const errJson = await cashInRes.json();
          detail = JSON.stringify(errJson);
          console.error("SyncPay cash-in error (json):", detail);
        } catch {
          detail = await cashInRes.text();
          console.error("SyncPay cash-in error (text):", detail);
        }
      } else {
        detail = await cashInRes.text();
        console.error("SyncPay cash-in error (non-json):", detail.substring(0, 300));
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar cobrança Pix", detail }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cashInData = await cashInRes.json();
    console.log("SyncPay cash-in response:", JSON.stringify(cashInData));

    // Extract pix_code and identifier from response
    const pixCode =
      cashInData.pix_code ??
      cashInData.data?.pix_code ??
      cashInData.qr_code ??
      cashInData.data?.qr_code;
    const identifier =
      cashInData.identifier ??
      cashInData.data?.identifier ??
      cashInData.id ??
      cashInData.data?.id;

    if (!pixCode || !identifier) {
      console.error("Unexpected SyncPay response:", cashInData);
      return new Response(
        JSON.stringify({
          error: "Resposta inesperada da SyncPay",
          raw: cashInData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ pix_code: pixCode, identifier }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("syncpay-cashin error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
