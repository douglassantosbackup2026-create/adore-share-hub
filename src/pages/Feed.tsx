import { useState } from "react";
import { useFollow } from "@/hooks/useFollow";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, Bookmark, Send, Loader2 } from "lucide-react";
import PostSkeleton from "@/components/PostSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { mockCreators } from "@/data/creators";
import { usePosts } from "@/hooks/usePosts";
import { useCreators } from "@/hooks/useCreators";
import { useAuth } from "@/contexts/AuthContext";
import { useMySubscriptions } from "@/hooks/useMySubscriptions";
import { useComments } from "@/hooks/useComments";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const mockPosts = [
  {
    id: "mock-1",
    creator: mockCreators[0],
    time: "2h atrás",
    text: "Treino de hoje foi incrível! 💪 Novo recorde pessoal no supino.",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&q=80",
    locked: false,
    likes: 482,
    comments: 37,
    liked: false,
  },
  {
    id: "mock-2",
    creator: mockCreators[1],
    time: "4h atrás",
    text: "Novo ensaio fotográfico exclusivo 🎨 Para assinantes VIP.",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=700&q=80",
    locked: true,
    likes: 1204,
    comments: 89,
    liked: false,
  },
  {
    id: "mock-3",
    creator: mockCreators[4],
    time: "6h atrás",
    text: "Aula gratuita de finanças pessoais hoje às 20h! Não perca 📊",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=80",
    locked: false,
    likes: 3102,
    comments: 214,
    liked: true,
  },
  {
    id: "mock-4",
    creator: mockCreators[6],
    time: "1d atrás",
    text: "Look do dia ✨ Esse combo de verão está me apaixonando.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80",
    locked: true,
    likes: 2891,
    comments: 156,
    liked: false,
  },
];

interface PixModalState {
  creatorId: string;
  creatorName: string;
  planName: string;
  amount: number;
}

// Fetches cheapest plan for each creator in the feed
function useCreatorPlansMap(creatorIds: string[]) {
  return useQuery({
    queryKey: ["creatorPlansMap", creatorIds.join(",")],
    queryFn: async () => {
      if (!creatorIds.length) return {} as Record<string, { plan_name: string; price: number }>;
      const { data, error } = await supabase
        .from("creator_plans")
        .select("creator_id, plan_name, price")
        .in("creator_id", creatorIds)
        .order("price", { ascending: true });
      if (error) throw error;
      // Keep only the cheapest plan per creator
      const map: Record<string, { plan_name: string; price: number }> = {};
      for (const row of data ?? []) {
        if (!map[row.creator_id]) {
          map[row.creator_id] = { plan_name: row.plan_name, price: Number(row.price) };
        }
      }
      return map;
    },
    enabled: creatorIds.length > 0,
  });
}

// Comment section for a single post
function CommentSection({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const { comments, isLoading, addComment } = useComments(postId);
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) {
      toast.error("Faça login para comentar");
      return;
    }
    addComment.mutate(
      { text: text.trim(), authorId: user.id },
      { onSuccess: () => setText("") }
    );
  };

  return (
    <div className="border-t border-border/40 px-4 py-3 flex flex-col gap-3">
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-1">Seja o primeiro a comentar</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <img
                src={c.author.avatar_url ?? "/placeholder.svg"}
                alt={c.author.name}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0 ring-1 ring-border/40"
              />
              <div className="bg-muted/50 rounded-xl px-3 py-1.5 min-w-0">
                <span className="text-xs font-semibold text-foreground mr-1.5">{c.author.name}</span>
                <span className="text-xs text-foreground/80">{c.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <img
            src={profile?.avatar_url ?? "/placeholder.svg"}
            alt=""
            className="h-7 w-7 rounded-full object-cover flex-shrink-0"
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-muted/50 border border-border/40 rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="text-primary disabled:text-muted-foreground transition-colors"
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// Follow button per suggestion item (needs its own component for hook rules)
function SuggestionItem({ creator }: { creator: { id: string | number; name: string; avatar_url?: string | null; avatar?: string; category?: string | null } }) {
  const { isFollowing, toggle, isPending } = useFollow(String(creator.id));
  return (
    <div className="flex items-center justify-between gap-2">
      <Link to={`/creator/${creator.id}`} className="flex items-center gap-2 min-w-0">
        <img src={creator.avatar_url || (creator as any).avatar || "/placeholder.svg"} alt={creator.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
          <p className="text-xs text-muted-foreground">{creator.category}</p>
        </div>
      </Link>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`text-xs font-semibold flex-shrink-0 transition-colors px-2 py-1 rounded-lg ${
          isFollowing
            ? "text-muted-foreground bg-muted/60"
            : "text-primary hover:text-primary/80"
        }`}
      >
        {isFollowing ? "Seguindo" : "Seguir"}
      </button>
    </div>
  );
}

const Feed = () => {
  const { posts: realPosts, likePost, isLoading: postsLoading } = usePosts();
  const { data: realCreators, isLoading: creatorsLoading } = useCreators();
  const { user, profile } = useAuth();
  const mySubscriptions = useMySubscriptions();
  const [localLikes, setLocalLikes] = useState<Set<string>>(new Set());
  const [mockState, setMockState] = useState(mockPosts);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [pixModal, setPixModal] = useState<PixModalState | null>(null);

  // Use real creators for stories/suggestions, fallback to mock
  const stories = realCreators?.length ? realCreators.slice(0, 6) : mockCreators.slice(0, 6);
  const suggestions = realCreators?.length ? realCreators.slice(0, 5) : mockCreators.slice(2, 5);

  // Use real posts or fallback to mock
  const useReal = realPosts.length > 0;

  // Fetch cheapest plans for all creators in the feed
  const creatorIds = useReal ? [...new Set(realPosts.map((p) => p.creator_id))] : [];
  const { data: plansMap = {} } = useCreatorPlansMap(creatorIds);

  const feedPosts = useReal
    ? realPosts.map((p) => ({
        id: p.id,
        creator: {
          id: p.creator_id,
          name: p.creator.name,
          handle: p.creator.handle ?? "",
          avatar: p.creator.avatar_url ?? mockCreators[0].avatar,
          price: 0,
        },
        time: formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ptBR }),
        text: p.text,
        image: p.media_url,
        locked: p.min_plan !== "free" && !mySubscriptions.has(p.creator_id),
        likes: p.likes_count,
        comments: 0,
        liked: localLikes.has(p.id),
      }))
    : mockPosts;

  const toggleLike = (id: string) => {
    if (useReal) {
      const post = realPosts.find((p) => p.id === id);
      if (post && !localLikes.has(id)) {
        setLocalLikes((prev) => new Set(prev).add(id));
        likePost.mutate({ postId: id, currentLikes: post.likes_count });
      }
    } else {
      setMockState((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  };

  const toggleComments = (id: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubscribeFromPost = (post: typeof feedPosts[number]) => {
    if (!user) {
      toast.error("Faça login para assinar");
      return;
    }
    const plan = plansMap[post.creator.id];
    setPixModal({
      creatorId: String(post.creator.id),
      creatorName: post.creator.name,
      planName: plan?.plan_name ?? "Plano Básico",
      amount: plan?.price ?? 9.9,
    });
  };

  const displayPosts = useReal ? feedPosts : mockState;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl pt-24 pb-16 flex gap-8">
        {/* Main feed */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Stories */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              {creatorsLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))
                : stories.map((creator) => (
                    <Link key={creator.id} to={`/creator/${creator.id}`} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full p-0.5 bg-gradient-primary shadow-glow">
                          <img
                            src={(creator as any).avatar_url || (creator as any).avatar || "/placeholder.svg"}
                            alt={creator.name}
                            className="h-full w-full rounded-full object-cover border-2 border-background"
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground max-w-[60px] truncate">{creator.name.split(" ")[0]}</span>
                    </Link>
                  ))}
            </div>
          </div>

          {/* Mobile suggestions */}
          <div className="flex lg:hidden gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {suggestions.map((creator) => (
              <Link key={creator.id} to={`/creator/${creator.id}`} className="flex items-center gap-2 flex-shrink-0 glass-card rounded-xl px-3 py-2">
                <img
                  src={(creator as any).avatar_url || (creator as any).avatar || "/placeholder.svg"}
                  alt={creator.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{creator.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(creator as any).category}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Posts */}
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
          ) : displayPosts.map((post) => (
            <div key={post.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <Link to={`/creator/${post.creator.id}`} className="flex items-center gap-3">
                  <img src={post.creator.avatar} alt={post.creator.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{post.creator.name}</p>
                    <p className="text-xs text-muted-foreground">@{post.creator.handle} · {post.time}</p>
                  </div>
                </Link>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {post.text && (
                <p className="px-4 pb-3 text-sm text-foreground">{post.text}</p>
              )}

              {post.image && (
                <div className="relative">
                  <img
                    src={post.image}
                    alt="Post"
                    className={`w-full aspect-[4/3] object-cover ${post.locked ? "blur-xl scale-105" : ""}`}
                  />
                  {post.locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-sm">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                        <Lock className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Conteúdo exclusivo</p>
                      <button
                        onClick={() => handleSubscribeFromPost(post)}
                        className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
                      >
                        Assinar para ver
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <Heart className={`h-5 w-5 ${post.liked ? "fill-primary" : ""}`} />
                    <span>{post.likes.toLocaleString("pt-BR")}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${openComments.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MessageCircle className={`h-5 w-5 ${openComments.has(post.id) ? "fill-primary/20" : ""}`} />
                    <span>{useReal ? (openComments.has(post.id) ? "−" : "+") : String(post.comments)}</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/creator/${post.creator.id}`;
                      if (navigator.share) {
                        navigator.share({ title: `${post.creator.name} na Flare`, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success("Link copiado!");
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              {/* Comments section — only for real posts */}
              {useReal && openComments.has(post.id) && (
                <CommentSection postId={post.id} />
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-primary-foreground font-bold text-lg">
                  {(profile?.name || "V").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">{profile?.name || "Você"}</p>
              <p className="text-xs text-muted-foreground">@{profile?.handle || "voce"}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Sugestões para você</p>
            {suggestions.map((creator) => (
              <SuggestionItem key={creator.id} creator={creator} />
            ))}
          </div>
        </aside>
      </div>

      {/* PIX Payment Modal — triggered from locked posts */}
      {pixModal && user && (
        <PixPaymentModal
          open={!!pixModal}
          onClose={() => setPixModal(null)}
          onSuccess={() => setPixModal(null)}
          creatorId={pixModal.creatorId}
          creatorName={pixModal.creatorName}
          planName={pixModal.planName}
          amount={pixModal.amount}
          fanId={user.id}
          fanEmail={user.email ?? ""}
        />
      )}
    </div>
  );
};

export default Feed;
