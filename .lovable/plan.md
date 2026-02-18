

# Fase 3 — Conectar Paginas ao Banco de Dados

## Resumo

Substituir todos os dados mock por queries reais ao banco de dados, manter os mocks como fallback quando o banco estiver vazio, e adicionar funcionalidades de escrita (upload, assinatura, mensagens em tempo real). A implementacao sera feita em etapas sequenciais.

---

## Etapa 1: Migration de Storage RLS + Tipos + Hooks

### 1.1 Migration: Storage RLS policies

Adicionar policies nos buckets `avatars`, `covers` e `content` para permitir upload por usuarios autenticados, restrito ao proprio path (`auth.uid()/filename`).

### 1.2 Criar `src/types/profile.ts`

Interface unificada `CreatorWithStats` que mapeia a tabela `profiles` com dados agregados:

```text
CreatorWithStats {
  id: string (UUID)
  name, handle, bio, avatar_url, cover_url, category, role
  price: number (menor preco do creator_plans)
  subscribers: number (count subscriptions ativas)
  postCount: number (count posts)
}
```

### 1.3 Criar hooks com React Query

| Hook | Arquivo | Funcao |
|---|---|---|
| `useCreators` | `src/hooks/useCreators.ts` | Lista criadores com stats agregados (profiles + creator_plans + counts) |
| `useCreatorProfile` | `src/hooks/useCreatorProfile.ts` | Perfil individual + planos + posts + verificacao de assinatura |
| `usePosts` | `src/hooks/usePosts.ts` | Posts com join em profiles, like real via update |
| `useConversations` | `src/hooks/useConversations.ts` | Lista conversas agrupadas com ultima mensagem |
| `useMessages` | `src/hooks/useMessages.ts` | Mensagens de uma conversa + realtime + envio + marcar como lido |
| `useDashboardStats` | `src/hooks/useDashboardStats.ts` | Revenue, subscriber count, post count |
| `useSubscription` | `src/hooks/useSubscription.ts` | Verificar/criar assinatura |

---

## Etapa 2: Adaptar componentes e paginas

### 2.1 `CreatorCard.tsx`

- Mudar `Creator.id` de `number` para `string | number` para compatibilidade com mocks e dados reais
- Usar `avatar_url` e `cover_url` com fallback para `avatar` e `cover`

### 2.2 `Discover.tsx`

- Usar `useCreators()` para buscar criadores reais
- Se o banco retornar vazio, usar `mockCreators` como fallback
- Manter filtros de busca e categoria funcionando

### 2.3 `CreatorProfile.tsx`

- Buscar perfil real via `useCreatorProfile(id)`
- Buscar planos reais de `creator_plans`
- Botao "Assinar" funcional: cria registro em `subscriptions`
- Fallback para mock se nao encontrado

### 2.4 `Feed.tsx`

- Buscar posts reais com `usePosts()` (join com profiles)
- Like real: update `likes_count` no banco
- Stories: criadores com assinaturas ativas do usuario
- Sugestoes: criadores que o usuario nao segue
- Fallback para mock posts se banco vazio

### 2.5 `Messages.tsx`

- `useConversations()` para lista de contatos
- `useMessages(contactId)` para mensagens + realtime via `supabase.channel()`
- Enviar mensagem: INSERT com `sender_id = auth.uid()`
- Marcar como lido ao abrir conversa
- Fallback para mock conversations se banco vazio

### 2.6 `Dashboard.tsx`

- Stats reais via `useDashboardStats()`:
  - Receita = soma precos das assinaturas ativas
  - Assinantes = count subscriptions ativas
  - Posts = count posts do criador
- Upload funcional: `supabase.storage.from('content').upload()` + INSERT em posts
- Nome do usuario logado via `useAuth()`
- Grafico de receita: mock por enquanto

### 2.7 `Settings.tsx`

- Carregar perfil real via `useAuth()` (profile do AuthContext)
- Salvar: UPDATE em `profiles` (nome, handle, bio, social_links)
- Upload avatar: `supabase.storage.from('avatars').upload()` + update `avatar_url`
- Upload capa: `supabase.storage.from('covers').upload()` + update `cover_url`
- Planos: UPSERT em `creator_plans` (apenas criadores)
- Senha: `supabase.auth.updateUser({ password })`

---

## Detalhes Tecnicos

### Estrategia de fallback

Cada hook retorna os dados do banco. Nas paginas, se o array retornado estiver vazio e nao houver erro, os mocks sao usados. Isso garante que a UI nunca fica vazia durante desenvolvimento.

### Queries principais

**useCreators:**
1. `profiles` WHERE `role = 'creator'`
2. `creator_plans` para todos os criadores (agrupa menor preco)
3. Conta posts e subscriptions via queries separadas

**usePosts:**
1. `posts` com select + join em `profiles` (nome, avatar, handle)
2. RLS controla visibilidade automaticamente

**useMessages (realtime):**
1. `messages` WHERE sender/receiver = userId, ordered by created_at
2. `supabase.channel('messages').on('postgres_changes', ...)` para updates em tempo real
3. Cleanup do channel no unmount

### Arquivos a criar (8 novos)
- `src/types/profile.ts`
- `src/hooks/useCreators.ts`
- `src/hooks/useCreatorProfile.ts`
- `src/hooks/usePosts.ts`
- `src/hooks/useConversations.ts`
- `src/hooks/useMessages.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useSubscription.ts`

### Arquivos a modificar (7 existentes)
- `src/components/CreatorCard.tsx` — interface Creator com id: string | number
- `src/pages/Discover.tsx` — useCreators() + fallback
- `src/pages/CreatorProfile.tsx` — hooks reais + assinar
- `src/pages/Feed.tsx` — usePosts() + like real
- `src/pages/Messages.tsx` — hooks + realtime
- `src/pages/Dashboard.tsx` — stats reais + upload
- `src/pages/Settings.tsx` — salvar perfil real

### Migration necessaria
- Storage RLS policies para buckets avatars, covers, content

