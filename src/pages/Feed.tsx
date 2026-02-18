import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Lock, MoreHorizontal, Bookmark } from "lucide-react";
import Navbar from "@/components/Navbar";
import { mockCreators } from "@/data/creators";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const stories = mockCreators.slice(0, 6);

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

const suggestions = mockCreators.slice(2, 5);

const Feed = () => {
  const { posts: realPosts, likePost } = usePosts();
  const { user, profile } = useAuth();
  const [localLikes, setLocalLikes] = useState<Set<string>>(new Set());

  // Use real posts or fallback to mock
  const useReal = realPosts.length > 0;

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
        locked: p.min_plan !== "free",
        likes: p.likes_count,
        comments: 0,
        liked: localLikes.has(p.id),
      }))
    : mockPosts;

  const [mockState, setMockState] = useState(mockPosts);

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
              {stories.map((creator) => (
                <Link key={creator.id} to={`/creator/${creator.id}`} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full p-0.5 bg-gradient-primary shadow-glow">
                      <img
                        src={creator.avatar}
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

          {/* Posts */}
          {displayPosts.map((post) => (
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
                      <Link
                        to={`/creator/${post.creator.id}`}
                        className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
                      >
                        Assinar para ver
                      </Link>
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
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
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
              <div key={creator.id} className="flex items-center justify-between gap-2">
                <Link to={`/creator/${creator.id}`} className="flex items-center gap-2 min-w-0">
                  <img src={creator.avatar} alt={creator.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{creator.category}</p>
                  </div>
                </Link>
                <Link
                  to={`/creator/${creator.id}`}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex-shrink-0"
                >
                  Seguir
                </Link>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Feed;
