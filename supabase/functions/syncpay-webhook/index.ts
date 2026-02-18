import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("SyncPay webhook payload:", JSON.stringify(payload));

    // SyncPay sends { data: { status, identifier, metadata, ... } }
    const data = payload.data ?? payload;
    const status = data.status ?? payload.status;
    const identifier = data.identifier ?? data.id ?? payload.identifier;
    const metadata = data.metadata ?? payload.metadata ?? {};

    if (status !== "completed" && status !== "COMPLETED") {
      console.log(`Ignoring status: ${status}`);
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fanId = metadata.fan_id;
    const creatorId = metadata.creator_id;
    const plan = metadata.plan;
    const amount = metadata.amount;

    if (!fanId || !creatorId || !plan) {
      console.error("Missing metadata fields:", metadata);
      return new Response(
        JSON.stringify({ error: "Missing metadata" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: check if subscription already exists for this syncpay_id
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("syncpay_id", identifier)
      .maybeSingle();

    if (existing) {
      console.log("Subscription already activated for identifier:", identifier);
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate any previous subscription for this fan+creator
    await supabase
      .from("subscriptions")
      .update({ active: false })
      .eq("fan_id", fanId)
      .eq("creator_id", creatorId);

    // Insert new active subscription
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        fan_id: fanId,
        creator_id: creatorId,
        plan,
        active: true,
        syncpay_id: identifier,
      });

    if (insertError) {
      console.error("Insert subscription error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fire Meta Purchase event
    try {
      const projectId = Deno.env.get("SUPABASE_URL")!
        .split(".")[0]
        .split("//")[1];
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/meta-capi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_name: "Purchase",
            value: amount,
            currency: "BRL",
          }),
        }
      );
    } catch (metaErr) {
      console.error("Meta CAPI error (non-fatal):", metaErr);
    }

    console.log(`Subscription activated: fan=${fanId} creator=${creatorId} plan=${plan}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("syncpay-webhook error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
