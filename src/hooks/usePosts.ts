import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PostWithCreator } from "@/types/profile";

export function usePosts() {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["feedPosts"],
    queryFn: async (): Promise<PostWithCreator[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, creator:profiles!posts_creator_id_fkey(id, name, handle, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        text: row.text,
        media_url: row.media_url,
        media_type: row.media_type,
        likes_count: row.likes_count,
        min_plan: row.min_plan,
        created_at: row.created_at,
        creator_id: row.creator_id,
        creator: row.creator,
      }));
    },
  });

  const likePost = useMutation({
    mutationFn: async ({ postId, currentLikes }: { postId: string; currentLikes: number }) => {
      const { error } = await supabase
        .from("posts")
        .update({ likes_count: currentLikes + 1 })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
    },
  });

  return {
    posts: postsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    likePost,
  };
}
