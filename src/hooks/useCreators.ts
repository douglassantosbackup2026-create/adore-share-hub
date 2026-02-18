import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CreatorWithStats } from "@/types/profile";

export function useCreators() {
  return useQuery({
    queryKey: ["creators"],
    queryFn: async (): Promise<CreatorWithStats[]> => {
      // 1. Get all creator profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "creator");

      if (error) throw error;
      if (!profiles?.length) return [];

      const creatorIds = profiles.map((p) => p.id);

      // 2. Get lowest price per creator
      const { data: plans } = await supabase
        .from("creator_plans")
        .select("creator_id, price")
        .in("creator_id", creatorIds);

      const priceMap = new Map<string, number>();
      plans?.forEach((p) => {
        const current = priceMap.get(p.creator_id);
        if (current === undefined || p.price < current) {
          priceMap.set(p.creator_id, p.price);
        }
      });

      // 3. Get subscription counts
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("creator_id")
        .in("creator_id", creatorIds)
        .eq("active", true);

      const subsMap = new Map<string, number>();
      subs?.forEach((s) => {
        subsMap.set(s.creator_id, (subsMap.get(s.creator_id) || 0) + 1);
      });

      // 4. Get post counts
      const { data: posts } = await supabase
        .from("posts")
        .select("creator_id")
        .in("creator_id", creatorIds);

      const postsMap = new Map<string, number>();
      posts?.forEach((p) => {
        postsMap.set(p.creator_id, (postsMap.get(p.creator_id) || 0) + 1);
      });

      return profiles
        .filter((p) => (postsMap.get(p.id) ?? 0) > 0)
        .map((p) => ({
        ...p,
        price: priceMap.get(p.id) ?? 0,
        subscribers: subsMap.get(p.id) ?? 0,
        postCount: postsMap.get(p.id) ?? 0,
        // Compat fields
        avatar: p.avatar_url || "",
        cover: p.cover_url || "",
        posts: postsMap.get(p.id) ?? 0,
        rating: 4.8,
        verified: true,
        tags: p.category ? [p.category] : [],
      }));
    },
  });
}
