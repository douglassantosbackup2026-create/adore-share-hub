import { supabase } from "@/integrations/supabase/client";

interface MetaCapiEvent {
  event_name: string;
  user_email?: string;
  value?: number;
  currency?: string;
  creator_pixel_id?: string;
  creator_access_token?: string;
}

export async function sendMetaEvent(event: MetaCapiEvent): Promise<void> {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(
      `https://${projectId}.supabase.co/functions/v1/meta-capi`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
        },
        body: JSON.stringify({
          ...event,
          client_user_agent: navigator.userAgent,
          event_source_url: window.location.href,
        }),
      }
    );
  } catch {
    // Fire-and-forget: never block the user flow
  }
}

