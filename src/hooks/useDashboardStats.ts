import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLATFORM_FEE_RATE } from "@/lib/constants";

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboardStats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const userId = user!.id;

      // Active subscriptions for this creator
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, plan, fan_id, created_at")
        .eq("creator_id", userId)
        .eq("active", true);

      // Plans for price lookup
      const { data: plans } = await supabase
        .from("creator_plans")
        .select("plan_name, price")
        .eq("creator_id", userId);

      const planPriceMap = new Map<string, number>();
      plans?.forEach((p) => planPriceMap.set(p.plan_name, p.price));

      const revenue = (subs ?? []).reduce((sum, s) => {
        return sum + (planPriceMap.get(s.plan) ?? 0);
      }, 0);

      // Post count
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId);

      // Recent subscribers with profile info
      const recentSubIds = (subs ?? [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      let recentSubscribers: { name: string; avatar: string; plan: string; since: string }[] = [];
      if (recentSubIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", recentSubIds.map((s) => s.fan_id));

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

        recentSubscribers = recentSubIds.map((s) => {
          const profile = profileMap.get(s.fan_id);
          const diff = Date.now() - new Date(s.created_at).getTime();
          const hours = Math.floor(diff / 3600000);
          const since = hours < 24 ? `há ${hours}h` : `há ${Math.floor(hours / 24)}d`;
          return {
            name: profile?.name ?? "Usuário",
            avatar: profile?.avatar_url ?? "",
            plan: s.plan,
            since,
          };
        });
      }

      return {
        revenue,
        subscriberCount: subs?.length ?? 0,
        postCount: postCount ?? 0,
        recentSubscribers,
      };
    },
  });
}
