

# Fase 3 — Implementacao Completa

## Resumo

Aplicar a migration de Storage RLS + realtime, criar tipos compartilhados, 7 hooks customizados e adaptar 7 arquivos existentes para usar dados reais do banco.

---

## Etapa 1: Migration SQL

Criar `supabase/migrations/20260218_storage_rls_and_realtime.sql` com:
- 12 policies de Storage RLS (INSERT/UPDATE/DELETE/SELECT) para os buckets `avatars`, `covers` e `content`
- Cada policy restringe operacoes ao path `auth.uid()/filename`
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages`

---

## Etapa 2: Tipos compartilhados

Criar `src/types/profile.ts` com:
- `CreatorWithStats` — profile + price, subscribers, postCount agregados
- `PostWithCreator` — post com dados do criador (join)
- `ConversationItem` — conversa agrupada com ultima mensagem

---

## Etapa 3: Hooks customizados (7 arquivos novos)

| Hook | Funcao principal |
|---|---|
| `useCreators` | Busca profiles role=creator + agrega menor preco, contagem posts/subs |
| `useCreatorProfile` | Perfil individual + planos + posts |
| `usePosts` | Posts com join em profiles, mutacao de like |
| `useConversations` | Lista conversas agrupadas por contato com unread count |
| `useMessages` | Mensagens de uma conversa + realtime channel + envio + marcar lido |
| `useDashboardStats` | Revenue, subscriber count, post count, recent subscribers |
| `useSubscription` | Verifica assinatura ativa + mutacao para assinar |

---

## Etapa 4: Adaptar componentes e paginas (7 arquivos)

### CreatorCard.tsx
- `id: string | number` na interface
- Aceitar `avatar_url`/`cover_url` com fallback para `avatar`/`cover`

### Discover.tsx
- Usar `useCreators()`, fallback para `mockCreators` se vazio
- Filtros e sort continuam funcionando

### CreatorProfile.tsx
- `useCreatorProfile(id)` para dados reais
- `useSubscription(id)` para botao de assinar funcional
- Planos reais de `creator_plans`
- Fallback para mock

### Feed.tsx
- `usePosts()` para posts reais com join
- Like real via `likePost()` mutation
- Sidebar com dados do usuario logado via `useAuth()`
- Fallback para mock posts

### Messages.tsx
- `useConversations()` para lista de contatos
- `useMessages(contactId)` para chat + realtime
- `sendMessage()` para enviar
- Marcar como lido automatico
- Fallback para mock conversations

### Dashboard.tsx
- `useDashboardStats()` para stats reais
- Upload funcional com `supabase.storage.from('content').upload()`
- INSERT em `posts` apos upload
- Nome real do usuario via `useAuth()`
- Grafico mantido como mock

### Settings.tsx
- Carregar perfil real via `useAuth()`
- UPDATE em `profiles` ao salvar (nome, handle, bio, social_links)
- Upload avatar/capa para storage + update URL
- UPSERT em `creator_plans` (tab planos)
- `supabase.auth.updateUser({ password })` para alterar senha

---

## Arquivos a criar (9)
- `supabase/migrations/20260218_storage_rls_and_realtime.sql`
- `src/types/profile.ts`
- `src/hooks/useCreators.ts`
- `src/hooks/useCreatorProfile.ts`
- `src/hooks/usePosts.ts`
- `src/hooks/useConversations.ts`
- `src/hooks/useMessages.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useSubscription.ts`

## Arquivos a modificar (7)
- `src/components/CreatorCard.tsx`
- `src/pages/Discover.tsx`
- `src/pages/CreatorProfile.tsx`
- `src/pages/Feed.tsx`
- `src/pages/Messages.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Settings.tsx`

