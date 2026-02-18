import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIXEL_ID = "4384406811885630";
const API_VERSION = "v18.0";

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const META_CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN");
  if (!META_CAPI_TOKEN) {
    return new Response(JSON.stringify({ error: "META_CAPI_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { event_name, user_email, value, currency, event_source_url, client_user_agent, client_ip_address } = await req.json();

    if (!event_name) {
      return new Response(JSON.stringify({ error: "event_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user_data — Facebook requires at least client_ip_address + client_user_agent
    // when no hashed identifiers (email/phone) are present
    const userData: Record<string, string> = {};

    if (user_email) {
      userData.em = hashEmail(user_email);
    }

    // Use caller-supplied IP/UA or fall back to request headers
    const ip = client_ip_address ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "";
    if (ip) userData.client_ip_address = ip;

    const ua = client_user_agent || req.headers.get("user-agent") || "";
    if (ua) userData.client_user_agent = ua;

    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: crypto.randomUUID(),
      action_source: "website",
      user_data: userData,
    };

    if (event_source_url) {
      eventData.event_source_url = event_source_url;
    }

    if (value !== undefined) {
      eventData.custom_data = {
        value,
        currency: currency ?? "BRL",
      };
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [eventData] }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
