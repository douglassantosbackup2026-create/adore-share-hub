import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription(creatorId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ["subscription", user?.id, creatorId],
    enabled: !!user && !!creatorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("fan_id", user!.id)
        .eq("creator_id", creatorId!)
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const subscribe = useMutation({
    mutationFn: async (plan: string) => {
      const { error } = await supabase.from("subscriptions").insert({
        fan_id: user!.id,
        creator_id: creatorId!,
        plan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id, creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creatorSubsCount", creatorId] });
    },
  });

  return {
    subscription: subscriptionQuery.data,
    isSubscribed: !!subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading,
    subscribe,
  };
}
