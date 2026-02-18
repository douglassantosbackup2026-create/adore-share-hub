
# Página de Administração da Plataforma

## Visão geral

Uma área restrita acessível apenas a administradores, com rota `/admin`, protegida por uma verificação no banco via a função `has_role(auth.uid(), 'admin')` já existente. A página terá um layout com abas laterais (sidebar) para navegar entre as seções de gestão.

---

## O que o admin precisa gerenciar

Baseado nas tabelas existentes (`profiles`, `subscriptions`, `posts`, `creator_plans`, `follows`, `messages`, `post_comments`), a página terá 5 seções:

### 1. Visão Geral (Dashboard)
Métricas globais da plataforma em cards:
- Total de criadores cadastrados
- Total de fãs cadastrados
- Total de assinaturas ativas
- Receita total estimada (soma de todos os planos ativos)
- Total de posts publicados
- Gráfico de crescimento de assinantes por mês

### 2. Gestão de Usuários
Tabela paginada com todos os usuários (fãs e criadores):
- Colunas: Avatar, Nome, Handle, Role, Data de cadastro, Nº de assinaturas
- Filtro por role (todos / criadores / fãs)
- Busca por nome ou handle
- Ação: **Banir usuário** (deleta o perfil → cascade remove posts, assinaturas etc.)
- Ação: **Ver perfil** (link para `/creator/:id` ou `/profile/:id`)

### 3. Gestão de Criadores
Tabela focada somente em criadores:
- Colunas: Nome, Handle, Categoria, Assinantes ativos, Receita estimada, Posts publicados
- Ordenação por receita ou assinantes
- Ação: **Ver planos** (modal com os 3 planos e preços do criador)
- Ação: **Ver posts** (link para o perfil do criador)

### 4. Gestão de Posts
Tabela de todos os posts publicados na plataforma:
- Colunas: Thumbnail (se tiver mídia), Criador, Legenda (truncada), Plano mínimo, Data, Nº de likes, Nº de comentários
- Filtro por plano (free / fan / superfan / vip)
- Ação: **Deletar post** (remove do banco — a política RLS `Creators can delete their own posts` só vale para o próprio criador; o admin precisará de uma função RPC com `SECURITY DEFINER` para deletar qualquer post)

### 5. Financeiro
- Total de receita estimada por mês (reaproveitando a lógica do `get_creator_monthly_revenue` mas para todos os criadores)
- Top 10 criadores por receita
- Tabela de todas as assinaturas ativas com: criador, fã, plano, valor, data de início

---

## Arquitetura técnica

### Proteção de rota

Novo componente `AdminRoute` que usa `has_role` via consulta ao banco (não localStorage):

```text
/admin → AdminRoute verifica role 'admin' no banco → renderiza ou redireciona para /
```

### Banco de dados — mudanças necessárias

**Nova função RPC para deletar qualquer post (admin):**
```sql
CREATE OR REPLACE FUNCTION admin_delete_post(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM posts WHERE id = p_post_id;
END; $$;
```

**Nova função RPC para métricas globais:**
```sql
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
  total_creators bigint,
  total_fans bigint,
  total_active_subs bigint,
  total_posts bigint,
  estimated_revenue numeric
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles WHERE role = 'creator'),
    (SELECT COUNT(*) FROM profiles WHERE role = 'fan'),
    (SELECT COUNT(*) FROM subscriptions WHERE active = true),
    (SELECT COUNT(*) FROM posts),
    (SELECT COALESCE(SUM(cp.price), 0)
     FROM subscriptions s
     JOIN creator_plans cp ON cp.creator_id = s.creator_id AND cp.plan_name = s.plan
     WHERE s.active = true);
$$;
```

### Novos arquivos

| Arquivo | Função |
|---|---|
| `src/components/AdminRoute.tsx` | Guarda a rota `/admin`, verifica role admin no banco |
| `src/pages/Admin.tsx` | Página principal com layout de sidebar + abas |
| `src/hooks/usePlatformStats.ts` | Chama `get_platform_stats()` RPC |
| `src/hooks/useAdminUsers.ts` | Busca todos os perfis com contagem de assinaturas |
| `src/hooks/useAdminPosts.ts` | Busca todos os posts com joins para criador |

### Layout da página

```text
┌─────────────────────────────────────────────────────────┐
│  🔥 Adore Admin Panel                   [sair do admin] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  📊 Visão    │   [ área de conteúdo da aba ativa ]      │
│     Geral    │                                          │
│              │                                          │
│  👥 Usuários │                                          │
│              │                                          │
│  ✨ Criadores│                                          │
│              │                                          │
│  📝 Posts    │                                          │
│              │                                          │
│  💰 Financ.  │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

A sidebar usa o componente `Sidebar` do shadcn/ui já instalado no projeto, com `SidebarProvider` wrappando a página. No mobile, a sidebar vira um drawer off-canvas.

---

## Sequência de implementação

1. Migração de banco: criar as 2 funções RPC (`get_platform_stats` e `admin_delete_post`)
2. `AdminRoute.tsx`: verifica `has_role` via query, redireciona se não for admin
3. `usePlatformStats.ts`, `useAdminUsers.ts`, `useAdminPosts.ts`: hooks de dados
4. `Admin.tsx`: página completa com sidebar e 5 abas
5. `App.tsx`: adicionar a rota `/admin`

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| Banco de dados | 2 novas funções RPC |
| `src/components/AdminRoute.tsx` | Criado |
| `src/pages/Admin.tsx` | Criado |
| `src/hooks/usePlatformStats.ts` | Criado |
| `src/hooks/useAdminUsers.ts` | Criado |
| `src/hooks/useAdminPosts.ts` | Criado |
| `src/App.tsx` | Nova rota `/admin` |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente |

