

# Flare — Backend Completo com Lovable Cloud

## Objetivo
Transformar o protótipo visual em uma plataforma funcional com autenticação real, banco de dados persistente e storage para arquivos.

---

## Fase 1: Ativar Lovable Cloud e Banco de Dados

### Tabelas a criar

**profiles** — dados do perfil do usuário
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK, FK -> auth.users) | ON DELETE CASCADE |
| role | text ('fan' ou 'creator') | NOT NULL |
| name | text | NOT NULL |
| handle | text | UNIQUE, obrigatório para criadores |
| bio | text | Opcional |
| avatar_url | text | URL do storage |
| cover_url | text | URL do storage |
| category | text | Para criadores (Fitness, Arte, etc.) |
| social_links | jsonb | Instagram, Twitter, etc. |
| created_at | timestamptz | default now() |

**user_roles** — tabela separada de roles (seguranca)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK -> auth.users) | ON DELETE CASCADE |
| role | app_role (enum) | 'admin', 'moderator', 'user' |

**posts** — conteudo dos criadores
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| creator_id | uuid (FK -> profiles) | ON DELETE CASCADE |
| text | text | Legenda do post |
| media_url | text | URL do storage |
| media_type | text | 'image' ou 'video' |
| min_plan | text | 'free', 'fan', 'superfan', 'vip' |
| likes_count | integer | default 0 |
| created_at | timestamptz | |

**subscriptions** — assinaturas ativas
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| fan_id | uuid (FK -> profiles) | ON DELETE CASCADE |
| creator_id | uuid (FK -> profiles) | ON DELETE CASCADE |
| plan | text | 'fan', 'superfan', 'vip' |
| active | boolean | default true |
| created_at | timestamptz | |
| UNIQUE | (fan_id, creator_id) | |

**messages** — mensagens diretas
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| sender_id | uuid (FK -> profiles) | |
| receiver_id | uuid (FK -> profiles) | |
| text | text | NOT NULL |
| read | boolean | default false |
| created_at | timestamptz | |

**creator_plans** — precos dos planos por criador
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| creator_id | uuid (FK -> profiles) | ON DELETE CASCADE |
| plan_name | text | 'fan', 'superfan', 'vip' |
| price | decimal | em reais |
| UNIQUE | (creator_id, plan_name) | |

### Storage Buckets
- **avatars** — bucket publico para fotos de perfil
- **covers** — bucket publico para capas
- **content** — bucket privado para fotos/videos de posts

### RLS (Row Level Security)
- **profiles**: SELECT publico (para exibir perfis), UPDATE apenas pelo proprio usuario
- **posts**: SELECT publico para posts free; SELECT condicional baseado em assinatura para posts pagos
- **subscriptions**: SELECT/INSERT pelo fan, SELECT pelo creator
- **messages**: SELECT/INSERT apenas pelos participantes da conversa
- **creator_plans**: SELECT publico, UPDATE/INSERT apenas pelo criador
- **user_roles**: politicas com funcao security definer `has_role()`

### Trigger
- Trigger `on_auth_user_created` que cria automaticamente um registro em `profiles` com os dados do signup (nome, role, handle, categoria)

---

## Fase 2: Autenticacao Real

### Signup (`/signup`)
- Chamar `supabase.auth.signUp()` com metadados extras (nome, role, handle, categoria)
- O trigger automaticamente cria o perfil
- Redirecionar criador para `/dashboard`, fan para `/feed`

### Login (`/login`)
- Chamar `supabase.auth.signInWithPassword()`
- Redirecionar baseado no role do usuario

### Contexto de autenticacao
- Criar `src/contexts/AuthContext.tsx` com:
  - `onAuthStateChange` listener (configurado ANTES de `getSession`)
  - Estado global: `user`, `profile`, `loading`
  - Funcoes: `signIn`, `signUp`, `signOut`
- Criar `src/components/ProtectedRoute.tsx` para proteger rotas autenticadas

### Atualizacao de paginas
- **Navbar**: substituir `useState(false)` por estado real do AuthContext
- **Feed, Messages, Dashboard, Settings**: proteger com ProtectedRoute
- **Login/Signup**: redirecionar se ja autenticado

---

## Fase 3: Conectar Paginas ao Banco

### Feed
- Buscar posts reais com join em profiles
- Verificar assinatura do usuario para mostrar/esconder conteudo bloqueado

### Messages
- Buscar conversas reais do banco
- Enviar mensagens com INSERT
- Subscription em tempo real para novas mensagens

### Dashboard
- Buscar stats reais: contagem de assinantes, posts, receita
- Upload real de conteudo via Storage API
- Listar ultimos assinantes do banco

### Settings
- Carregar e salvar perfil real (nome, bio, avatar, redes sociais)
- Upload de avatar/capa via Storage
- Atualizar precos dos planos na tabela `creator_plans`

### CreatorProfile
- Buscar perfil e posts reais do banco
- Verificar se o usuario ja assina o criador
- Botao de assinar cria registro em `subscriptions`

---

## Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `src/integrations/supabase/` | Gerado automaticamente pelo Lovable Cloud |
| `src/contexts/AuthContext.tsx` | Novo — contexto de autenticacao |
| `src/components/ProtectedRoute.tsx` | Novo — wrapper de rota protegida |
| `src/pages/Login.tsx` | Modificar — usar supabase auth |
| `src/pages/Signup.tsx` | Modificar — usar supabase auth com metadados |
| `src/pages/Feed.tsx` | Modificar — buscar posts reais |
| `src/pages/Messages.tsx` | Modificar — mensagens reais + realtime |
| `src/pages/Dashboard.tsx` | Modificar — dados reais + upload |
| `src/pages/Settings.tsx` | Modificar — salvar perfil real |
| `src/pages/CreatorProfile.tsx` | Modificar — dados reais + assinatura |
| `src/components/Navbar.tsx` | Modificar — usar AuthContext |
| `src/App.tsx` | Modificar — wrapping com AuthProvider + ProtectedRoute |

---

## Detalhes tecnicos

- Lovable Cloud sera ativado como primeiro passo (gera a integracao Supabase automaticamente)
- Todas as migrations serao criadas via ferramenta de migracao do Lovable
- Dados mock em `src/data/creators.ts` serao mantidos como fallback mas substituidos por queries reais
- Funcao `has_role()` com SECURITY DEFINER para evitar recursao infinita em RLS
- Tipo enum `app_role` para roles administrativos (separado do campo `role` em profiles que e fan/creator)
- Storage com buckets publicos para avatars/covers e privado para conteudo
- `onAuthStateChange` configurado ANTES de `getSession()` no AuthContext
- Signup usa `emailRedirectTo: window.location.origin`

