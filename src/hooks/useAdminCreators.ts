import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminCreator {
  creator_id: string;
  creator_name: string;
  creator_handle: string | null;
  creator_category: string | null;
  active_subs: number;
  estimated_revenue: number;
  post_count: number;
}

export function useAdminCreators() {
  return useQuery({
    queryKey: ["adminCreators"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_creator_stats");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        creator_id: r.creator_id,
        creator_name: r.creator_name,
        creator_handle: r.creator_handle,
        creator_category: r.creator_category,
        active_subs: Number(r.active_subs ?? 0),
        estimated_revenue: Number(r.estimated_revenue ?? 0),
        post_count: Number(r.post_count ?? 0),
      })) as AdminCreator[];
    },
  });
}
