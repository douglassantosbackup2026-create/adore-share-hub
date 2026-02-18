import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a Set of creator_ids that the current user actively subscribes to.
 * Used by the feed to determine which paid posts should be unlocked.
 */
export function useMySubscriptions(): Set<string> {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["mySubscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("creator_id")
        .eq("fan_id", user!.id)
        .eq("active", true);

      if (error) throw error;
      return (data ?? []).map((row) => row.creator_id);
    },
  });

  return new Set(data ?? []);
}
