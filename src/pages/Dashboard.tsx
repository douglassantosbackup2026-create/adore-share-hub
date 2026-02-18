import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign, Users, FileImage, Star, TrendingUp, Upload, Bell, Settings,
  ArrowUpRight, ArrowDownRight, Plus, Eye, X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { mockCreators } from "@/data/creators";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMonthlyRevenue } from "@/hooks/useMonthlyRevenue";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

const planColors: Record<string, string> = {
  "Fã": "bg-muted/50 text-muted-foreground",
  "Super Fã": "bg-primary/20 text-primary",
  "VIP": "bg-amber-500/20 text-amber-400",
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { data: dashStats } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useMonthlyRevenue(user?.id);
  const [uploadHover, setUploadHover] = useState(false);
  const [postText, setPostText] = useState("");
  const [minPlan, setMinPlan] = useState("free");
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.name || "Criador";

  const mockRecentSubscribers = [
    { name: "Mariana A.", avatar: mockCreators[1].avatar, plan: "Super Fã", since: "há 2h" },
    { name: "Carolina P.", avatar: mockCreators[3].avatar, plan: "VIP", since: "há 5h" },
    { name: "Beatriz S.", avatar: mockCreators[5].avatar, plan: "Fã", since: "há 1d" },
    { name: "Larissa M.", avatar: mockCreators[7].avatar, plan: "Super Fã", since: "há 2d" },
    { name: "Amanda F.", avatar: mockCreators[2].avatar, plan: "Fã", since: "há 3d" },
  ];

  const recentSubscribers = dashStats?.recentSubscribers?.length
    ? dashStats.recentSubscribers
    : mockRecentSubscribers;

  const stats = [
    {
      label: "Receita Mensal",
      value: dashStats ? `R$ ${dashStats.revenue.toLocaleString("pt-BR")}` : "R$ 6.100",
      change: "+18%",
      up: true,
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      label: "Assinantes",
      value: dashStats ? dashStats.subscriberCount.toLocaleString("pt-BR") : "1.247",
      change: "+84",
      up: true,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Posts",
      value: dashStats ? dashStats.postCount.toString() : "348",
      change: "+12 este mês",
      up: true,
      icon: FileImage,
      color: "text-blue-400",
    },
    {
      label: "Avaliação Média",
      value: "4.9 ⭐",
      change: "+0.1",
      up: true,
      icon: Star,
      color: "text-amber-400",
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewUrl(url);
    setPreviewOpen(true);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handlePublish = async () => {
    if (!previewFile || !user) return;
    setUploading(true);
    try {
      const ext = previewFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(path, previewFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("content").getPublicUrl(path);
      const mediaType = previewFile.type.startsWith("video") ? "video" : "image";
      const { error: postError } = await supabase.from("posts").insert({
        creator_id: user.id,
        text: postText || null,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        min_plan: minPlan,
      });
      if (postError) throw postError;

      toast.success("Conteúdo publicado com sucesso!");
      setPostText("");
      setMinPlan("free");
      closePreview();
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl pt-24 pb-16 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Olá, <span className="text-gradient">{displayName}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1">Aqui está o resumo da sua conta</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <Link to="/settings">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 text-xs">
                {stat.up ? (
                  <ArrowUpRight className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                )}
                <span className={stat.up ? "text-green-400" : "text-red-400"}>{stat.change}</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-foreground">Receita Mensal</h2>
                <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">+18% este mês</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(340 80% 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(340 80% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(340 80% 58%)" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent subscribers */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-foreground">Novos Assinantes</h2>
            <div className="flex flex-col gap-3">
              {recentSubscribers.map((sub, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={sub.avatar} alt={sub.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.since}</p>
                  </div>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${planColors[sub.plan] || "bg-muted/50 text-muted-foreground"}`}>
                    {sub.plan}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload new content */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Publicar novo conteúdo</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Textarea
              placeholder="Escreva uma legenda para seu post..."
              className="bg-muted/20 border-border/50 resize-none flex-1"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="flex flex-col gap-2 sm:w-48">
              <Label className="text-sm text-muted-foreground">Acesso mínimo</Label>
              <Select value={minPlan} onValueChange={setMinPlan}>
                <SelectTrigger className="bg-muted/20 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">🌐 Todos (gratuito)</SelectItem>
                  <SelectItem value="fan">💖 Fã</SelectItem>
                  <SelectItem value="superfan">🔥 Super Fã</SelectItem>
                  <SelectItem value="vip">💎 VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer ${
              uploadHover ? "border-primary/60 bg-primary/5" : "border-border/50 bg-muted/10"
            }`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${uploadHover ? "bg-gradient-primary shadow-glow" : "bg-muted/30"}`}>
              <Upload className={`h-6 w-6 ${uploadHover ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Arraste arquivos ou clique para fazer upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">Fotos e vídeos — máx. 500MB</p>
            </div>
            <Button
              className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Selecionar arquivo
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Preview do post
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {previewUrl && previewFile && (
              previewFile.type.startsWith("video") ? (
                <video src={previewUrl} controls className="w-full max-h-64 rounded-xl object-contain bg-black" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full max-h-64 rounded-xl object-contain bg-muted/20" />
              )
            )}
            <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Legenda</p>
              <p className="text-sm text-foreground">
                {postText || <span className="text-muted-foreground italic">Sem legenda</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Acesso mínimo:</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {minPlan === "free" ? "🌐 Todos" : minPlan === "fan" ? "💖 Fã" : minPlan === "superfan" ? "🔥 Super Fã" : "💎 VIP"}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePreview} className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handlePublish}
              disabled={uploading}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform gap-2"
            >
              {uploading ? "Publicando..." : "Publicar agora →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
