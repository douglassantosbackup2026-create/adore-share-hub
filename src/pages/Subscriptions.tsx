import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Clock, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useMySubscriptionsDetail } from "@/hooks/useMySubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS } from "@/lib/plans";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Subscriptions = () => {
  const { user } = useAuth();
  const { data: subs = [], isLoading } = useMySubscriptionsDetail();
  const [pixModal, setPixModal] = useState<{
    creatorId: string;
    creatorName: string;
    planName: string;
    amount: number;
  } | null>(null);

  const daysUntil = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Minhas assinaturas</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : subs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não tem assinaturas ativas.</p>
            <Link
              to="/discover"
              className="inline-flex rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
            >
              Descobrir criadores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((sub) => {
              const days = daysUntil(sub.expires_at);
              const expiringSoon = days !== null && days <= 7 && days > 0;
              return (
                <div
                  key={sub.id}
                  className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <img
                    src={sub.creator_avatar || "/placeholder.svg"}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/creator/${sub.creator_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {sub.creator_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Plano {PLAN_LABELS[sub.plan] ?? sub.plan} · R${" "}
                      {sub.price.toFixed(2).replace(".", ",")}/mês
                    </p>
                    {sub.expires_at && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${expiringSoon ? "text-amber-500" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" />
                        Expira em {format(new Date(sub.expires_at), "dd MMM yyyy", { locale: ptBR })}
                        {expiringSoon && ` (${days} dias)`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPixModal({
                        creatorId: sub.creator_id,
                        creatorName: sub.creator_name,
                        planName: sub.plan,
                        amount: sub.price,
                      })
                    }
                    className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    Renovar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {user && pixModal && (
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

export default Subscriptions;
