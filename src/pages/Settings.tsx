import { useState, useRef, useEffect } from "react";
import { Camera, Save, Eye, EyeOff, Shield, CreditCard, Banknote, Instagram, Twitter, Youtube, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const withdrawals = [
  { id: 1, amount: "R$ 3.200,00", date: "01/02/2026", status: "Concluído" },
  { id: 2, amount: "R$ 2.800,00", date: "01/01/2026", status: "Concluído" },
  { id: 3, amount: "R$ 1.950,00", date: "01/12/2025", status: "Concluído" },
];

const Settings = () => {
  const { profile: authProfile, user, refreshProfile } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    handle: "",
    bio: "",
    instagram: "",
    twitter: "",
    youtube: "",
    meta_pixel_id: "",
    meta_access_token: "",
  });

  const [plans, setPlans] = useState({
    fan: "29.90",
    superfan: "49.90",
    vip: "89.90",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load profile data
  useEffect(() => {
    if (authProfile) {
      const social = (authProfile.social_links as any) ?? {};
      setProfileForm({
        name: authProfile.name || "",
        handle: authProfile.handle || "",
        bio: authProfile.bio || "",
        instagram: social.instagram || "",
        twitter: social.twitter || "",
        youtube: social.youtube || "",
        meta_pixel_id: social.meta_pixel_id || "",
        meta_access_token: social.meta_access_token || "",
      });
    }
  }, [authProfile]);

  // Load plans
  useEffect(() => {
    if (!user) return;
    supabase
      .from("creator_plans")
      .select("*")
      .eq("creator_id", user.id)
      .then(({ data }) => {
        if (data?.length) {
          const map: Record<string, string> = {};
          data.forEach((p) => {
            const normalized = p.plan_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            if (normalized === "fa" || normalized === "fan") map.fan = p.price.toString();
            else if (normalized.includes("super")) map.superfan = p.price.toString();
            else if (normalized.includes("vip")) map.vip = p.price.toString();
          });
          setPlans((prev) => ({ ...prev, ...map }));
        }
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: profileForm.name,
        handle: profileForm.handle,
        bio: profileForm.bio,
        social_links: {
          instagram: profileForm.instagram,
          twitter: profileForm.twitter,
          youtube: profileForm.youtube,
        },
      });

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      setSaved(true);
      toast.success("Perfil salvo!");
      await refreshProfile();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) {
      toast.error("Erro ao enviar avatar");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    toast.success("Avatar atualizado!");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("covers").upload(path, file);
    if (uploadError) {
      toast.error("Erro ao enviar capa");
      return;
    }

    const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
    await supabase.from("profiles").update({ cover_url: urlData.publicUrl }).eq("id", user.id);
    toast.success("Capa atualizada!");
  };

  const handleSavePlans = async () => {
    if (!user) return;
    const planEntries = [
      { plan_name: "Fã", price: parseFloat(plans.fan) },
      { plan_name: "Super Fã", price: parseFloat(plans.superfan) },
      { plan_name: "VIP", price: parseFloat(plans.vip) },
    ];

    for (const entry of planEntries) {
      await supabase
        .from("creator_plans")
        .upsert(
          { creator_id: user.id, plan_name: entry.plan_name, price: entry.price },
          { onConflict: "creator_id,plan_name", ignoreDuplicates: false }
        );
    }
    setSaved(true);
    toast.success("Planos salvos!");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const avatarUrl = authProfile?.avatar_url || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="w-full grid grid-cols-4 mb-8 bg-muted/30 border border-border/50 rounded-xl p-1 h-auto">
            {[
              { value: "profile", label: "Perfil" },
              { value: "plans", label: "Planos" },
              { value: "payments", label: "Pagamentos" },
              { value: "security", label: "Segurança" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg py-2.5 text-sm data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PERFIL */}
          <TabsContent value="profile">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted ring-2 ring-primary/40 flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {profileForm.name.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <button onClick={() => avatarRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                    <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{profileForm.name}</p>
                  <p className="text-sm text-muted-foreground">@{profileForm.handle}</p>
                </div>
              </div>

              {/* Cover upload */}
              <div className="flex flex-col gap-2">
                <Label>Imagem de capa</Label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <div
                  onClick={() => coverRef.current?.click()}
                  className="relative h-32 rounded-xl overflow-hidden border border-border/50 cursor-pointer group"
                >
                  {authProfile?.cover_url ? (
                    <img src={authProfile.cover_url} alt="Capa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted/30 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Clique para adicionar uma capa</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Nome</Label>
                  <Input className="bg-muted/20 border-border/50" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Handle</Label>
                  <Input className="bg-muted/20 border-border/50" value={profileForm.handle} onChange={(e) => setProfileForm((p) => ({ ...p, handle: e.target.value }))} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Biografia</Label>
                <Textarea className="bg-muted/20 border-border/50 resize-none min-h-[100px]" value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} />
              </div>

              <div className="flex flex-col gap-3">
                <Label>Redes sociais</Label>
                {[
                  { icon: Instagram, key: "instagram", placeholder: "@instagram" },
                  { icon: Twitter, key: "twitter", placeholder: "@twitter" },
                  { icon: Youtube, key: "youtube", placeholder: "Canal do YouTube" },
                ].map(({ icon: Icon, key, placeholder }) => (
                  <div key={key} className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 bg-muted/20 border-border/50"
                      placeholder={placeholder}
                      value={profileForm[key as keyof typeof profileForm]}
                      onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveProfile}
                className={`self-end rounded-full px-6 transition-all ${saved ? "bg-green-500 hover:bg-green-500" : "bg-gradient-primary shadow-glow hover:scale-105"} text-primary-foreground`}
              >
                <Save className="h-4 w-4 mr-2" />
                {saved ? "Salvo!" : "Salvar alterações"}
              </Button>
            </div>
          </TabsContent>

          {/* PLANOS */}
          <TabsContent value="plans">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">Defina os preços dos seus planos de assinatura mensal.</p>
              {[
                { key: "fan", label: "Fã", emoji: "💜", desc: "Acesso ao conteúdo básico" },
                { key: "superfan", label: "Super Fã", emoji: "💎", desc: "Acesso a conteúdo exclusivo e stories" },
                { key: "vip", label: "VIP", emoji: "👑", desc: "Acesso total + mensagens diretas" },
              ].map(({ key, label, emoji, desc }) => (
                <div key={key} className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                  <div className="text-2xl flex-shrink-0">{emoji}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      className="w-24 bg-muted/20 border-border/50 text-right"
                      value={plans[key as keyof typeof plans]}
                      onChange={(e) => setPlans((p) => ({ ...p, [key]: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSavePlans}
                className={`self-end rounded-full px-6 transition-all ${saved ? "bg-green-500 hover:bg-green-500" : "bg-gradient-primary shadow-glow hover:scale-105"} text-primary-foreground`}
              >
                <Save className="h-4 w-4 mr-2" />
                {saved ? "Salvo!" : "Salvar planos"}
              </Button>
            </div>
          </TabsContent>

          {/* PAGAMENTOS */}
          <TabsContent value="payments">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Taxa da plataforma</p>
                  <p className="text-sm text-muted-foreground">
                    A plataforma retém 20% de cada assinatura como taxa de serviço. Você recebe 80% do valor dos seus planos.
                  </p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Dados bancários</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Banco</Label>
                    <Input className="bg-muted/20 border-border/50" placeholder="Ex: Nubank" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Tipo de conta</Label>
                    <Input className="bg-muted/20 border-border/50" placeholder="Corrente / Poupança" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Agência</Label>
                    <Input className="bg-muted/20 border-border/50" placeholder="0001" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Conta</Label>
                    <Input className="bg-muted/20 border-border/50" placeholder="000000-0" />
                  </div>
                  <div className="col-span-2 flex flex-col gap-2">
                    <Label>Chave PIX</Label>
                    <Input className="bg-muted/20 border-border/50" placeholder="CPF, e-mail ou telefone" />
                  </div>
                </div>
                <Button className="self-end rounded-full px-6 bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform">
                  <Save className="h-4 w-4 mr-2" /> Salvar dados
                </Button>
              </div>

              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Histórico de saques</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg bg-muted/20 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{w.amount}</p>
                        <p className="text-xs text-muted-foreground">{w.date}</p>
                      </div>
                      <span className="text-xs font-semibold text-green-400 rounded-full bg-green-400/10 px-3 py-1">{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SEGURANÇA */}
          <TabsContent value="security">
            <div className="flex flex-col gap-4">
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Alterar senha</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Nova senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pr-10 bg-muted/20 border-border/50"
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Confirmar nova senha</Label>
                    <Input
                      type="password"
                      className="bg-muted/20 border-border/50"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleChangePassword} className="self-end rounded-full px-6 bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform">
                  Atualizar senha
                </Button>
              </div>

              <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Autenticação em dois fatores</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Adiciona uma camada extra de segurança à sua conta</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>

              {twoFactor && (
                <div className="glass-card rounded-2xl p-5 border border-primary/30 bg-primary/5">
                  <p className="text-sm text-foreground font-medium mb-2">🔐 Dois fatores ativado!</p>
                  <p className="text-xs text-muted-foreground">Você receberá um código por SMS ou e-mail a cada novo login.</p>
                </div>
              )}

              <div className="glass-card rounded-2xl p-6">
                <p className="font-semibold text-foreground mb-1">Zona de perigo</p>
                <p className="text-sm text-muted-foreground mb-4">Ações irreversíveis para sua conta.</p>
                <Button variant="destructive" className="rounded-full px-6">
                  Excluir conta
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
