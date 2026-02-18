
# Fase 3 — Conectar Paginas ao Banco de Dados

## Resumo
Substituir todos os dados mock por queries reais ao banco, manter os mocks como fallback quando o banco estiver vazio, e adicionar funcionalidades de escrita (upload, assinatura, mensagens em tempo real).

---

## 1. Discover — Listar criadores reais

**Arquivo:** `src/pages/Discover.tsx`

- Buscar perfis com `role = 'creator'` da tabela `profiles`
- Buscar o menor preco de cada criador via `creator_plans`
- Contar posts e assinantes via queries separadas ou subqueries
- Se o banco estiver vazio, usar `mockCreators` como fallback
- Atualizar a interface `Creator` em `CreatorCard.tsx` para aceitar `id: string` (UUID) em vez de `number`

**Queries:**
- `profiles` WHERE role = 'creator'
- `creator_plans` para preco minimo
- `posts` count por creator_id
- `subscriptions` count (active) por creator_id

---

## 2. CreatorProfile — Perfil real + Assinatura

**Arquivo:** `src/pages/CreatorProfile.tsx`

- Buscar perfil pelo `id` (UUID) ou `handle` da URL
- Buscar posts reais do criador (respeitando RLS — posts free ficam visiveis, pagos so com assinatura)
- Buscar planos reais de `creator_plans`
- Verificar se o usuario logado ja assina o criador
- Botao "Assinar" cria registro em `subscriptions` com o plano selecionado
- Exibir media_url real nos posts (imagens do storage)

**Mudancas:**
- Rota muda de `/creator/:id` (numerico) para aceitar UUID
- Fallback para mock se perfil nao encontrado no banco

---

## 3. Feed — Posts reais com controle de acesso

**Arquivo:** `src/pages/Feed.tsx`

- Buscar posts com join em `profiles` (nome, avatar, handle do criador)
- RLS ja controla visibilidade: posts free aparecem para todos, pagos so para assinantes
- Posts bloqueados (que o RLS nao retorna) podem ser exibidos com blur usando uma query separada que retorna apenas metadados
- Like: incrementar `likes_count` no banco
- Stories: buscar criadores que o usuario segue (assinaturas ativas)
- Sidebar "Sugestoes": criadores que o usuario NAO segue

---

## 4. Messages — Chat real + Realtime

**Arquivo:** `src/pages/Messages.tsx`

- Buscar conversas agrupando mensagens por remetente/destinatario
- Listar contatos com ultima mensagem e contagem de nao lidas
- Enviar mensagem: INSERT na tabela `messages` com `sender_id = auth.uid()`
- Marcar como lida: UPDATE `read = true` quando abrir conversa
- Realtime: `supabase.channel('messages')` para receber novas mensagens em tempo real
- Join com `profiles` para exibir nome e avatar

---

## 5. Dashboard — Stats reais + Upload

**Arquivo:** `src/pages/Dashboard.tsx`

- Stats reais:
  - Receita: soma dos precos das assinaturas ativas do criador
  - Assinantes: count de subscriptions ativas
  - Posts: count de posts do criador
- Upload de conteudo:
  - Usar `supabase.storage.from('content').upload()` para arquivos
  - Criar registro em `posts` com a URL retornada
- Novos assinantes: buscar ultimas subscriptions com join em profiles
- Grafico de receita: manter mock por enquanto (dados historicos precisariam de tabela de transacoes)

---

## 6. Settings — Salvar perfil real

**Arquivo:** `src/pages/Settings.tsx`

- Carregar perfil do usuario logado via `AuthContext`
- Salvar alteracoes: UPDATE em `profiles` (nome, handle, bio, social_links)
- Upload de avatar: `supabase.storage.from('avatars').upload()` + update `avatar_url`
- Upload de capa: `supabase.storage.from('covers').upload()` + update `cover_url`
- Salvar planos: UPSERT em `creator_plans` (apenas para criadores)
- Alterar senha: `supabase.auth.updateUser({ password })`

---

## 7. CreatorCard — Adaptar para dados reais

**Arquivo:** `src/components/CreatorCard.tsx`

- Mudar interface `Creator` para aceitar `id: string` (UUID)
- Ajustar Link para usar UUID
- Campos como `subscribers`, `posts`, `rating` virao das queries ou serao calculados
- Manter compatibilidade com mocks (campos opcionais com defaults)

---

## Detalhes Tecnicos

### Tipo Profile reutilizavel
Criar `src/types/profile.ts` com interface unificada que mapeia a tabela `profiles` e dados agregados (subscriber count, post count, price).

### Hooks customizados
Criar hooks com React Query para reutilizar queries:
- `useCreators()` — lista criadores com stats agregados
- `useCreatorProfile(id)` — perfil completo de um criador
- `usePosts(creatorId?)` — posts com filtros
- `useConversations()` — lista de conversas do usuario
- `useMessages(contactId)` — mensagens de uma conversa
- `useDashboardStats()` — stats do dashboard
- `useSubscription(creatorId)` — verifica assinatura ativa

### Realtime (Messages)
- Usar `supabase.channel()` com `postgres_changes` na tabela messages
- A tabela `messages` ja esta habilitada para realtime (migration anterior)

### Storage RLS
- Verificar se os buckets `avatars`, `covers`, `content` tem policies de upload configuradas
- Se nao, criar migration para adicionar policies de storage

### Arquivos a criar
| Arquivo | Descricao |
|---|---|
| `src/types/profile.ts` | Tipos compartilhados |
| `src/hooks/useCreators.ts` | Hook para listar criadores |
| `src/hooks/useCreatorProfile.ts` | Hook para perfil individual |
| `src/hooks/usePosts.ts` | Hook para posts |
| `src/hooks/useConversations.ts` | Hook para conversas |
| `src/hooks/useMessages.ts` | Hook para mensagens + realtime |
| `src/hooks/useDashboardStats.ts` | Hook para stats do dashboard |
| `src/hooks/useSubscription.ts` | Hook para verificar/criar assinatura |

### Arquivos a modificar
| Arquivo | Mudanca |
|---|---|
| `src/pages/Discover.tsx` | Usar `useCreators()` |
| `src/pages/CreatorProfile.tsx` | Usar hooks reais + botao assinar funcional |
| `src/pages/Feed.tsx` | Usar `usePosts()` + like real |
| `src/pages/Messages.tsx` | Usar hooks de mensagens + realtime |
| `src/pages/Dashboard.tsx` | Usar stats reais + upload funcional |
| `src/pages/Settings.tsx` | Usar AuthContext + salvar no banco |
| `src/components/CreatorCard.tsx` | Adaptar interface para UUID |

### Migration necessaria
- Adicionar policies de storage para upload nos buckets (avatars, covers, content)
- Usuarios autenticados podem fazer upload no bucket de avatars/covers para seu proprio path
- Criadores podem fazer upload no bucket content
