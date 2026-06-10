import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, subject, body, template } = await req.json();

    if (!to_email || !subject) {
      return new Response(JSON.stringify({ error: "to_email and subject required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lovable Cloud Emails integration: log for now; wire to Cloud Emails when configured
    console.log("send-notification:", { to_email, subject, template, body: body?.slice?.(0, 100) });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: store notification log
    await supabase.from("conversion_events").insert({
      event_name: "email_sent",
      metadata: { to_email, subject, template },
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ ok: true, queued: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
