import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Statuses that mean the payment was confirmed and money received
const PAID_STATUSES = ["completed", "COMPLETED", "PAID_OUT", "paid", "PAID", "approved", "APPROVED"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("SyncPay webhook payload:", JSON.stringify(payload));

    // SyncPay sends { data: { status, idtransaction, ... } }
    const data = payload.data ?? payload;
    const status = data.status ?? payload.status;
    const identifier = data.idtransaction ?? data.identifier ?? data.id ?? payload.identifier;

    if (!PAID_STATUSES.includes(status)) {
      console.log(`Ignoring status: ${status}`);
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!identifier) {
      console.error("No identifier in webhook payload");
      return new Response(JSON.stringify({ error: "Missing identifier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: check if subscription already activated for this syncpay_id
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("syncpay_id", identifier)
      .maybeSingle();

    if (existingSub) {
      console.log("Subscription already activated for identifier:", identifier);
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up pending payment to get fan_id, creator_id, plan
    const { data: pending, error: pendingErr } = await supabase
      .from("pending_payments")
      .select("fan_id, creator_id, plan, amount")
      .eq("syncpay_id", identifier)
      .maybeSingle();

    if (pendingErr || !pending) {
      console.error("Pending payment not found for identifier:", identifier, pendingErr);
      return new Response(
        JSON.stringify({ error: "Pending payment not found", identifier }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { fan_id: fanId, creator_id: creatorId, plan, amount } = pending;

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

    // Clean up pending payment record
    await supabase
      .from("pending_payments")
      .delete()
      .eq("syncpay_id", identifier);

    // Fire Meta Purchase event (non-fatal) — platform + creator pixel
    try {
      // Fetch creator profile to get their pixel info
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("social_links")
        .eq("id", creatorId)
        .maybeSingle();

      const socialLinks = (creatorProfile?.social_links as Record<string, string> | null) ?? {};

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
            creator_pixel_id: socialLinks.meta_pixel_id || undefined,
            creator_access_token: socialLinks.meta_access_token || undefined,
          }),
        }
      );
    } catch (metaErr) {
      console.error("Meta CAPI error (non-fatal):", metaErr);
    }

    console.log(`Subscription activated: fan=${fanId} creator=${creatorId} plan=${plan} identifier=${identifier}`);

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
