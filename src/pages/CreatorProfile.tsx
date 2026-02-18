import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Heart, Star, Lock, MessageCircle, Share2, ChevronLeft, Check, Zap, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendMetaEvent } from "@/lib/metaCapi";

const defaultPlans = [
  {
    name: "Fã",
    emoji: "💖",
    desc: "Acesso ao feed exclusivo e mensagens",
    perks: ["Feed exclusivo", "Fotos exclusivas", "Mensagem direta"],
    multiplier: 1,
    popular: false,
  },
  {
    name: "Super Fã",
    emoji: "🔥",
    desc: "Tudo do plano Fã + conteúdo premium",
    perks: ["Tudo do plano Fã", "Vídeos em HD", "Lives privadas", "Desconto em PPV"],
    multiplier: 2.5,
    popular: true,
  },
  {
    name: "VIP",
    emoji: "💎",
    desc: "Experiência completa e exclusiva",
    perks: ["Tudo do Super Fã", "Chat em grupo VIP", "Conteúdo 4K", "Acesso antecipado"],
    multiplier: 5,
    popular: false,
  },
];

const postTypes = ["Todos", "Fotos", "Vídeos", "Lives"];

const CreatorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { profile: realProfile, plans: realPlans, posts: realPosts, subscriberCount } = useCreatorProfile(id);
  const { isSubscribed, subscribe } = useSubscription(id);

  const [activeTab, setActiveTab] = useState("Todos");
  const [liked, setLiked] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(0);

  // Fire ViewContent when profile is loaded
  useEffect(() => {
    if (realProfile) {
      sendMetaEvent({ event_name: "ViewContent" });
    }
  }, [realProfile?.id]);

  // If no real profile found, show 404
  if (!realProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl pt-32 pb-16 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Criador não encontrado</h1>
          <p className="text-muted-foreground mb-6">Este perfil não existe ou foi removido.</p>
          <Link to="/discover" className="rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
            Explorar criadores
          </Link>
        </div>
      </div>
    );
  }

  const creator = {
    ...realProfile,
    avatar: realProfile.avatar_url || "/placeholder.svg",
    cover: realProfile.cover_url || "/placeholder.svg",
    price: realPlans.length ? realPlans[0].price : 0,
    subscribers: subscriberCount || 0,
    posts: realPosts.length,
    rating: 4.8,
    verified: true,
    tags: realProfile.category ? [realProfile.category] : [],
    handle: realProfile.handle || "criador",
  };

  const plans = realPlans.length
    ? realPlans.map((p, i) => ({
        name: p.plan_name,
        emoji: ["💖", "🔥", "💎"][i % 3],
        desc: defaultPlans[i % 3]?.desc ?? "",
        perks: defaultPlans[i % 3]?.perks ?? [],
        price: p.price,
        popular: i === 1,
      }))
    : defaultPlans.map((p) => ({ ...p, price: (creator as any).price * p.multiplier }));

  const lockedPosts = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    locked: i > 2,
    type: i % 3 === 0 ? "video" : "photo",
  }));

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Faça login para assinar");
      return;
    }
    if (isSubscribed) {
      toast.info("Você já é assinante!");
      return;
    }
    sendMetaEvent({
      event_name: "InitiateCheckout",
      user_email: user.email,
      value: plans[selectedPlan].price,
      currency: "BRL",
    });
    try {
      await subscribe.mutateAsync(plans[selectedPlan].name);
      sendMetaEvent({
        event_name: "Purchase",
        user_email: user.email,
        value: plans[selectedPlan].price,
        currency: "BRL",
      });
      toast.success("Assinatura realizada com sucesso!");
    } catch {
      toast.error("Erro ao assinar. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Cover */}
      <div className="relative h-72 md:h-96 mt-16">
        <img src={creator.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <Link
          to="/discover"
          className="absolute top-6 left-6 flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-background/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <button className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background/80 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="container max-w-6xl">
        {/* Profile header */}
        <div className="relative -mt-20 mb-8 flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
          <div className="relative flex-shrink-0">
            <div className="h-32 w-32 rounded-2xl border-4 border-background overflow-hidden bg-muted ring-2 ring-primary/40 shadow-glow">
              <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
            </div>
            {creator.verified && (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 md:pb-2">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                  {creator.name}
                </h1>
                <p className="text-muted-foreground text-sm">@{creator.handle}</p>
              </div>
              {creator.category && (
                <span className="mt-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-medium text-primary">
                  {creator.category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{creator.subscribers.toLocaleString("pt-BR")}</span> fãs
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">{creator.posts}</span> posts
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4 text-accent fill-current" />
                <span className="font-semibold text-foreground">{creator.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 md:pb-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 ${
                liked
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40"
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200">
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-8">
          {/* Left — Posts */}
          <div>
            <div className="flex gap-1 mb-6 rounded-xl bg-muted p-1 w-fit">
              {postTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {lockedPosts.map((post) => (
                <div
                  key={post.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 cursor-pointer"
                >
                  {post.locked ? (
                    <>
                      <div className="h-full w-full bg-gradient-to-br from-muted to-secondary blur-sm" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm border border-border/60">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[10px] font-medium text-foreground/80">Conteúdo exclusivo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={creator.cover}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {post.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
                            <Zap className="h-4 w-4 text-primary fill-current" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Subscription plans */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Planos de assinatura</h2>

            {plans.map((plan, i) => {
              const price = plan.price.toFixed(2).replace(".", ",");
              return (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(i)}
                  className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                    selectedPlan === i
                      ? "border-primary/60 bg-primary/5 shadow-glow"
                      : "border-border/50 bg-gradient-card hover:border-primary/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-bold text-primary-foreground shadow-glow whitespace-nowrap">
                      Mais popular
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{plan.emoji}</span>
                      <div>
                        <p className="font-display font-bold text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-extrabold text-primary">R$ {price}</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <button
              onClick={handleSubscribe}
              className="w-full rounded-2xl bg-gradient-primary py-4 font-display font-bold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_hsl(340_80%_58%_/_0.5)]"
            >
              {isSubscribed
                ? "Já assinado ✓"
                : `Assinar por R$ ${plans[selectedPlan].price.toFixed(2).replace(".", ",")}/mês`}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};

export default CreatorProfile;
