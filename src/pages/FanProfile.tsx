import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Heart, ChevronLeft, UserCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

interface FanProfileData {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
}

interface FollowedCreator {
  creator_id: string;
  profiles: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

interface SubscribedCreator {
  creator_id: string;
  profiles: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

const FanProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isOwn = user?.id === id;

  const { data: fan, isLoading: loadingFan } = useQuery({
    queryKey: ["fanProfile", id],
    queryFn: async (): Promise<FanProfileData | null> => {
      if (!id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, cover_url, created_at")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: followed = [] } = useQuery({
    queryKey: ["fanFollows", id],
    queryFn: async (): Promise<FollowedCreator[]> => {
      if (!id) return [];
      const { data } = await supabase
        .from("follows")
        .select("creator_id, profiles:creator_id(id, name, handle, avatar_url)")
        .eq("fan_id", id);
      return (data as unknown as FollowedCreator[]) ?? [];
    },
    enabled: !!id,
  });

  const { data: subscribed = [] } = useQuery({
    queryKey: ["fanSubscriptions", id],
    queryFn: async (): Promise<SubscribedCreator[]> => {
      if (!id) return [];
      const { data } = await supabase
        .from("subscriptions")
        .select("creator_id, profiles:creator_id(id, name, handle, avatar_url)")
        .eq("fan_id", id)
        .eq("active", true);
      return (data as unknown as SubscribedCreator[]) ?? [];
    },
    enabled: !!id,
  });

  if (loadingFan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl pt-32 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!fan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl pt-32 pb-16 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Perfil não encontrado</h1>
          <p className="text-muted-foreground mb-6">Este perfil não existe ou foi removido.</p>
          <Link to="/" className="rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = format(new Date(fan.created_at), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Cover */}
      <div className="relative h-56 md:h-72 mt-16">
        {fan.cover_url ? (
          <img src={fan.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-background/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
      </div>

      <div className="container max-w-4xl">
        {/* Profile header */}
        <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end gap-5 md:gap-7">
          <div className="h-28 w-28 rounded-2xl border-4 border-background overflow-hidden bg-muted ring-2 ring-primary/30 shadow-glow flex-shrink-0">
            {fan.avatar_url ? (
              <img src={fan.avatar_url} alt={fan.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-primary">
                <UserCircle2 className="h-12 w-12 text-primary-foreground/70" />
              </div>
            )}
          </div>

          <div className="flex-1 md:pb-2">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-1">
              {fan.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {fan.handle ? `@${fan.handle} · ` : ""}Membro desde {memberSince}
            </p>

            <div className="flex gap-6 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{followed.length}</span> seguindo
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{subscribed.length}</span> assinaturas
              </div>
            </div>
          </div>

          {isOwn && (
            <Link
              to="/settings"
              className="md:pb-2 text-sm font-medium text-muted-foreground border border-border/60 rounded-xl px-4 py-2 hover:text-foreground hover:border-primary/40 transition-colors"
            >
              Editar perfil
            </Link>
          )}
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 gap-6 pb-16">
          {/* Followed creators */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Criadores que segue
              <span className="ml-auto text-xs font-normal text-muted-foreground">{followed.length}</span>
            </h2>
            {followed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ainda não segue nenhum criador</p>
            ) : (
              <div className="flex flex-col gap-3">
                {followed.map((f) => {
                  const creator = f.profiles;
                  if (!creator) return null;
                  return (
                    <Link
                      key={f.creator_id}
                      to={`/creator/${creator.id}`}
                      className="flex items-center gap-3 hover:bg-muted/40 rounded-xl p-2 -mx-2 transition-colors"
                    >
                      <img
                        src={creator.avatar_url ?? "/placeholder.svg"}
                        alt={creator.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
                        {creator.handle && (
                          <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subscribed creators */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Assinando agora
              <span className="ml-auto text-xs font-normal text-muted-foreground">{subscribed.length}</span>
            </h2>
            {subscribed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem assinaturas ativas</p>
            ) : (
              <div className="flex flex-col gap-3">
                {subscribed.map((s) => {
                  const creator = s.profiles;
                  if (!creator) return null;
                  return (
                    <Link
                      key={s.creator_id}
                      to={`/creator/${creator.id}`}
                      className="flex items-center gap-3 hover:bg-muted/40 rounded-xl p-2 -mx-2 transition-colors"
                    >
                      <img
                        src={creator.avatar_url ?? "/placeholder.svg"}
                        alt={creator.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
                        {creator.handle && (
                          <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                        )}
                      </div>
                      <span className="ml-auto flex-shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Ativo
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanProfile;
