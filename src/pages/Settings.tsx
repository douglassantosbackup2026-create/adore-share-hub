import { useState } from "react";
import { Camera, Save, Eye, EyeOff, Shield, CreditCard, Banknote, Instagram, Twitter, Youtube } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { mockCreators } from "@/data/creators";

const me = mockCreators[0];

const withdrawals = [
  { id: 1, amount: "R$ 3.200,00", date: "01/02/2026", status: "Concluído" },
  { id: 2, amount: "R$ 2.800,00", date: "01/01/2026", status: "Concluído" },
  { id: 3, amount: "R$ 1.950,00", date: "01/12/2025", status: "Concluído" },
];

const Settings = () => {
  const [profile, setProfile] = useState({
    name: me.name,
    handle: me.handle,
    bio: "Especialista em fitness e lifestyle saudável. Treinadora certificada com 8 anos de experiência. 💪🌿",
    instagram: "@anabeatriz",
    twitter: "@anabeatriz",
    youtube: "Ana Beatriz Fitness",
  });

  const [plans, setPlans] = useState({
    fan: "29.90",
    superfan: "49.90",
    vip: "89.90",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Configurações
          </h1>
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
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={me.avatar} alt={me.name} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" />
                  <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                    <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">@{profile.handle}</p>
                  <button className="text-xs text-primary hover:underline mt-1">Alterar foto de capa</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Nome</Label>
                  <Input className="bg-muted/20 border-border/50" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Handle</Label>
                  <Input className="bg-muted/20 border-border/50" value={profile.handle} onChange={(e) => setProfile(p => ({ ...p, handle: e.target.value }))} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Biografia</Label>
                <Textarea className="bg-muted/20 border-border/50 resize-none min-h-[100px]" value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} />
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
                      value={profile[key as keyof typeof profile]}
                      onChange={(e) => setProfile(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSave}
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
                      onChange={(e) => setPlans(p => ({ ...p, [key]: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>
              ))}
              <Button onClick={handleSave} className={`self-end rounded-full px-6 transition-all ${saved ? "bg-green-500 hover:bg-green-500" : "bg-gradient-primary shadow-glow hover:scale-105"} text-primary-foreground`}>
                <Save className="h-4 w-4 mr-2" />
                {saved ? "Salvo!" : "Salvar planos"}
              </Button>
            </div>
          </TabsContent>

          {/* PAGAMENTOS */}
          <TabsContent value="payments">
            <div className="flex flex-col gap-4">
              {/* Bank info */}
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

              {/* Withdrawal history */}
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
                    <Label>Senha atual</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} className="pr-10 bg-muted/20 border-border/50" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Nova senha</Label>
                    <Input type="password" className="bg-muted/20 border-border/50" placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Confirmar nova senha</Label>
                    <Input type="password" className="bg-muted/20 border-border/50" placeholder="Repita a nova senha" />
                  </div>
                </div>
                <Button className="self-end rounded-full px-6 bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform">
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
