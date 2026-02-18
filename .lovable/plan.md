
# 3 Melhorias: Seguir grátis, Filtrar criadores sem posts, Página de perfil do fã

## O que será feito

### 1. Sistema de "Seguir" gratuito

**Banco de dados — nova tabela `follows`:**
```sql
CREATE TABLE public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (fan_id, creator_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Fans can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = fan_id);
CREATE POLICY "Fans can unfollow" ON public.follows FOR DELETE USING (auth.uid() = fan_id);
```

**Hook `useFollow(creatorId)`** — novo arquivo `src/hooks/useFollow.ts`:
- Consulta se o usuário logado já segue o criador
- Mutation `follow()` — insert na tabela
- Mutation `unfollow()` — delete na tabela
- Retorna `{ isFollowing, follow, unfollow, followersCount }`

**Onde aparece o botão "Seguir":**

- `CreatorProfile.tsx` — ao lado dos botões de curtir/mensagem no header do perfil, um botão "Seguir" separado do botão de assinatura paga
- `Feed.tsx` — sidebar "Sugestões para você": o link "Seguir" vira um botão real com toggle
- `Discover.tsx` e `CreatorCard.tsx` — opcional/futuro (não muda agora para não inflar o escopo)

**Lógica visual:**
- Não seguindo → botão outline "Seguir" com ícone `UserPlus`
- Seguindo → botão preenchido "Seguindo ✓" com ícone `UserCheck`
- Usuário não logado → redireciona para `/login` com toast

---

### 2. Filtrar criadores sem posts no feed

**Onde ocorre o problema:**
- `useCreators.ts` já busca `postCount` por criador (via query na tabela `posts`)
- O `postsMap` está disponível, mas o retorno **não filtra** criadores com 0 posts

**Correção em `useCreators.ts`:**
Adicionar filtro no `.map()` final:
```ts
return profiles
  .filter(p => (postsMap.get(p.id) ?? 0) > 0)  // ← só quem postou
  .map((p) => ({ ... }));
```

**Impacto:**
- Stories no feed (`realCreators.slice(0, 6)`) — só mostra criadores com posts
- Sugestões na sidebar (`realCreators.slice(0, 5)`) — idem
- Discover (`useCreators()`) — idem

Isso não afeta o `CreatorProfile`, que usa `useCreatorProfile(id)` diretamente e não depende do `useCreators`.

---

### 3. Página de perfil do fã `/profile/:id`

**Nova página `src/pages/FanProfile.tsx`:**

Layout inspirado no perfil do criador, mas voltado para o fã:

```text
┌──────────────────────────────────────────────┐
│  [Cover (ou gradiente padrão)]               │
│  [Avatar]  Nome do fã                        │
│            @handle · Membro desde X          │
│                                              │
│  [X seguindo]   [Y assinantes]               │
├──────────────────────────────────────────────┤
│  Criadores que segue          Assinando agora │
│  [grid de avatares com link ao perfil]       │
└──────────────────────────────────────────────┘
```

**Dados buscados:**
- Perfil do fã via `profiles` (by `id` do param)
- Lista de criadores que ele segue via `follows`
- Lista de criadores que ele assina via `subscriptions` (só `creator_id`, não o valor)

**Acesso à própria página:**
- Navbar: o botão do avatar/settings passa a ter um link adicional "Meu perfil" → `/profile/:userId`
- A rota `/profile/:id` é pública (qualquer um pode ver o perfil de um fã)

**Rota adicionada em `App.tsx`:**
```tsx
<Route path="/profile/:id" element={<FanProfile />} />
```

**Atualizações na Navbar:**
- O ícone de usuário (settings) passa a exibir o avatar real do perfil quando existe (`profile.avatar_url`)
- Dropdown simples com "Meu perfil" e "Configurações" ao clicar

---

## Resumo técnico das mudanças

| Arquivo | Mudança |
|---|---|
| Banco de dados | Nova tabela `follows` + RLS |
| `src/hooks/useFollow.ts` | Novo hook |
| `src/hooks/useCreators.ts` | Filtrar criadores com `postCount > 0` |
| `src/pages/CreatorProfile.tsx` | Botão "Seguir" no header |
| `src/pages/Feed.tsx` | Botão "Seguir" funcional na sidebar |
| `src/pages/FanProfile.tsx` | Nova página |
| `src/components/Navbar.tsx` | Avatar real + link "Meu perfil" |
| `src/App.tsx` | Rota `/profile/:id` |

---

## Fluxo após as correções

**Seguir um criador:**
1. Usuário vê perfil do criador → clica "Seguir" (gratuito, ao lado do coração)
2. Botão muda para "Seguindo ✓" sem recarregar a página
3. Criador aparece nas sugestões como "seguido"

**Stories/Sugestões limpos:**
1. `useCreators` retorna apenas criadores com ≥ 1 post
2. Stories e sidebar do feed não mostram criadores "fantasma"

**Perfil do fã:**
1. Clica no avatar na navbar → menu com "Meu perfil"
2. Vê própria página pública com quem segue e quem assina
3. Qualquer pessoa pode acessar `/profile/:id` de um fã
