import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Star, FileText, DollarSign, LogOut, Flame, Trash2, Eye, Shield, CheckCircle, Clock, Link2,
} from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { PLATFORM_FEE_RATE } from "@/lib/constants";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminPosts, useAdminDeletePost } from "@/hooks/useAdminPosts";
import { useAdminCreators, useAdminPendingCreators, useApproveCreator } from "@/hooks/useAdminCreators";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyRevenue } from "@/hooks/useMonthlyRevenue";

type Section = "overview" | "users" | "creators" | "posts" | "financial";

const navItems = [
  { id: "overview" as Section, label: "Visão Geral", icon: LayoutDashboard },
  { id: "users" as Section, label: "Usuários", icon: Users },
  { id: "creators" as Section, label: "Criadores", icon: Star },
  { id: "posts" as Section, label: "Posts", icon: FileText },
  { id: "financial" as Section, label: "Financeiro", icon: DollarSign },
];

// ── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = usePlatformStats();

  const cards = [
    { label: "Criadores", value: stats?.total_creators, icon: Star, color: "text-yellow-500" },
    { label: "Fãs", value: stats?.total_fans, icon: Users, color: "text-blue-500" },
    { label: "Assinaturas ativas", value: stats?.total_active_subs, icon: Shield, color: "text-green-500" },
    { label: "Posts publicados", value: stats?.total_posts, icon: FileText, color: "text-purple-500" },
    {
      label: "Receita estimada",
      value: stats ? `R$ ${stats.estimated_revenue.toFixed(2)}` : undefined,
      icon: DollarSign, color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visão Geral da Plataforma</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <PlatformGrowthChart />
    </div>
  );
}

function PlatformGrowthChart() {
  const { data: creators } = useAdminCreators();
  // Aggregate all revenue across creators using global stats
  const { data: stats } = usePlatformStats();

  // Generate mock monthly progression from estimated revenue
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const revenue = stats?.estimated_revenue ?? 0;
  const chartData = months.map((month, i) => ({
    month,
    assinantes: Math.round(((stats?.total_active_subs ?? 0) * (i + 1)) / 6),
    receita: parseFloat(((revenue * (i + 1)) / 6).toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento da Plataforma (últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Area type="monotone" dataKey="assinantes" stroke="hsl(var(--primary))" fill="url(#colorSubs)" name="Assinantes" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const filtered = (users ?? []).filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.handle ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleBan = async (userId: string, name: string) => {
    const { error } = await supabase.rpc("admin_ban_user", { p_user_id: userId });
    if (error) {
      toast({ title: "Erro ao banir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${name} foi banido com sucesso.` });
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar por nome ou handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="creator">Criadores</SelectItem>
            <SelectItem value="fan">Fãs</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Assinaturas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{u.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.handle ? `@${u.handle}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "creator" ? "default" : "secondary"}>
                        {u.role === "creator" ? "Criador" : "Fã"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{u.sub_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={u.role === "creator" ? `/creator/${u.id}` : `/profile/${u.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Banir {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível. O perfil, posts e assinaturas serão removidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleBan(u.id, u.name)}
                              >
                                Banir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ── Creators Tab ─────────────────────────────────────────────────────────────
function CreatorsTab() {
  const { data: creators, isLoading } = useAdminCreators();
  const { data: pending, isLoading: pendingLoading } = useAdminPendingCreators();
  const approveMutation = useApproveCreator();
  const [sortBy, setSortBy] = useState<"revenue" | "subs">("revenue");
  const [plansCreator, setPlansCreator] = useState<string | null>(null);
  const [creatorPlans, setCreatorPlans] = useState<{ plan_name: string; price: number }[]>([]);
  const { toast } = useToast();

  const sorted = [...(creators ?? [])].sort((a, b) =>
    sortBy === "revenue"
      ? b.estimated_revenue - a.estimated_revenue
      : b.active_subs - a.active_subs,
  );

  const openPlans = async (creatorId: string) => {
    const { data } = await supabase
      .from("creator_plans")
      .select("plan_name, price")
      .eq("creator_id", creatorId);
    setCreatorPlans(data ?? []);
    setPlansCreator(creatorId);
  };

  const handleApprove = async (creatorId: string, name: string) => {
    try {
      await approveMutation.mutateAsync(creatorId);
      toast({ title: `${name} aprovado com sucesso!` });
    } catch (e: any) {
      toast({ title: "Erro ao aprovar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending creators section */}
      {(pendingLoading || (pending && pending.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Criadores Pendentes</h2>
            {!pendingLoading && pending && (
              <Badge variant="secondary">{pending.length}</Badge>
            )}
          </div>
          <Card className="border-border bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (pending ?? []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.handle ? `@${c.handle}` : "—"}
                        </TableCell>
                        <TableCell>{c.category ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(c.id, c.name)}
                            disabled={approveMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Approved creators section */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Gestão de Criadores</h2>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "revenue" | "subs")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Ordenar por receita</SelectItem>
            <SelectItem value="subs">Ordenar por assinantes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Assinantes</TableHead>
              <TableHead>Receita Est.</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : sorted.map((c) => (
                  <TableRow key={c.creator_id}>
                    <TableCell className="font-medium">{c.creator_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.creator_handle ? `@${c.creator_handle}` : "—"}
                    </TableCell>
                    <TableCell>{c.creator_category ?? "—"}</TableCell>
                    <TableCell>{c.active_subs}</TableCell>
                    <TableCell>R$ {c.estimated_revenue.toFixed(2)}</TableCell>
                    <TableCell>{c.post_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openPlans(c.creator_id)}>
                          Ver planos
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/creator/${c.creator_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!plansCreator} onOpenChange={(o) => !o && setPlansCreator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planos do Criador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {creatorPlans.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum plano cadastrado.</p>
            ) : (
              creatorPlans.map((p) => (
                <div key={p.plan_name} className="flex justify-between items-center py-2 border-b">
                  <Badge variant="outline" className="capitalize">{p.plan_name}</Badge>
                  <span className="font-semibold">R$ {p.price.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Posts Tab ────────────────────────────────────────────────────────────────
function PostsTab() {
  const { data: posts, isLoading } = useAdminPosts();
  const deleteMutation = useAdminDeletePost();
  const [planFilter, setPlanFilter] = useState("all");
  const { toast } = useToast();

  const filtered = (posts ?? []).filter(
    (p) => planFilter === "all" || p.min_plan === planFilter,
  );

  const handleDelete = async (postId: string) => {
    try {
      await deleteMutation.mutateAsync(postId);
      toast({ title: "Post deletado com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao deletar", description: e.message, variant: "destructive" });
    }
  };

  const planColors: Record<string, string> = {
    free: "secondary",
    fan: "default",
    superfan: "default",
    vip: "default",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Gestão de Posts</h2>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="fan">Fã</SelectItem>
            <SelectItem value="superfan">Super Fã</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mídia</TableHead>
              <TableHead>Criador</TableHead>
              <TableHead>Legenda</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>❤️</TableHead>
              <TableHead>💬</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      {post.media_url ? (
                        post.media_type === "video" ? (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            🎬
                          </div>
                        ) : (
                          <img
                            src={post.media_url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        )
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          📝
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{post.creator_name}</div>
                      {post.creator_handle && (
                        <div className="text-xs text-muted-foreground">@{post.creator_handle}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {post.text ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{post.min_plan}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{post.likes_count}</TableCell>
                    <TableCell>{post.comment_count}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. O post será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(post.id)}
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ── Financial Tab ────────────────────────────────────────────────────────────
function FinancialTab() {
  const { data: creators, isLoading: creatorsLoading } = useAdminCreators();
  const { data: stats } = usePlatformStats();
  const [subs, setSubs] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const top10 = [...(creators ?? [])].sort((a, b) => b.estimated_revenue - a.estimated_revenue).slice(0, 10);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("id, plan, created_at, active, creator_id, fan_id")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data?.length) { setSubsLoading(false); return; }
        const creatorIds = [...new Set(data.map((s) => s.creator_id))];
        const fanIds = [...new Set(data.map((s) => s.fan_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, handle")
          .in("id", [...creatorIds, ...fanIds]);
        const pm: Record<string, any> = {};
        (profiles ?? []).forEach((p) => { pm[p.id] = p; });
        const { data: plans } = await supabase
          .from("creator_plans")
          .select("creator_id, plan_name, price");
        const planMap: Record<string, number> = {};
        (plans ?? []).forEach((p) => { planMap[`${p.creator_id}-${p.plan_name}`] = p.price; });
        setSubs(data.map((s) => ({
          ...s,
          creator: pm[s.creator_id],
          fan: pm[s.fan_id],
          price: planMap[`${s.creator_id}-${s.plan}`] ?? 0,
        })));
        setSubsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financeiro</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita Total Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              R$ {(stats?.estimated_revenue ?? 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.total_active_subs ?? 0} assinaturas ativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comissão da Plataforma (20%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              R$ {((stats?.estimated_revenue ?? 0) * PLATFORM_FEE_RATE).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repasse aos Criadores (80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              R$ {((stats?.estimated_revenue ?? 0) * (1 - PLATFORM_FEE_RATE)).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Criadores por Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Criador</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Assinantes</TableHead>
                <TableHead>Receita Bruta</TableHead>
                <TableHead>Comissão (20%)</TableHead>
                <TableHead>Repasse (80%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatorsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : top10.map((c, i) => (
                    <TableRow key={c.creator_id}>
                      <TableCell className="font-bold text-muted-foreground">#{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{c.creator_name}</div>
                        {c.creator_handle && (
                          <div className="text-xs text-muted-foreground">@{c.creator_handle}</div>
                        )}
                      </TableCell>
                      <TableCell>{c.creator_category ?? "—"}</TableCell>
                      <TableCell>{c.active_subs}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {c.estimated_revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-primary">
                        R$ {(c.estimated_revenue * PLATFORM_FEE_RATE).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-green-500 font-semibold">
                        R$ {(c.estimated_revenue * (1 - PLATFORM_FEE_RATE)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criador</TableHead>
                <TableHead>Fã</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data de início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : subs.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.creator?.name ?? "—"}</TableCell>
                      <TableCell>{s.fan?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">R$ {s.price.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <OverviewTab />;
      case "users": return <UsersTab />;
      case "creators": return <CreatorsTab />;
      case "posts": return <PostsTab />;
      case "financial": return <FinancialTab />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary shrink-0" />
              <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Admin Panel</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map(({ id, label, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={activeSection === id}
                    onClick={() => setActiveSection(id)}
                    tooltip={label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/dashboard")} tooltip="Sair do Admin">
                  <LogOut className="h-4 w-4" />
                  <span>Sair do Admin</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">
              {navItems.find((n) => n.id === activeSection)?.label}
            </span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
