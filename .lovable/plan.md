
# Meus Posts na Página de Perfil (`/profile/:id`)

## Contexto atual

A página `/profile/:id` (`FanProfile.tsx`) é usada tanto por fãs quanto por criadores. Atualmente ela mostra:
- Criadores seguidos
- Assinaturas ativas

O objetivo é: quando o dono do perfil for um **criador**, exibir também uma grade com seus posts publicados, com opção de **editar** (legenda e nível de acesso) e **excluir** cada post.

---

## O que NÃO muda

- Fãs continuam vendo o perfil normalmente (sem seção de posts)
- A lógica de seguir e assinaturas permanece intacta
- Nenhuma migração de banco de dados é necessária — as RLS já permitem criadores deletar/atualizar seus próprios posts

---

## Mudanças planejadas

### 1. `src/pages/FanProfile.tsx` — seção de posts do criador

Adicionar, **apenas quando `isOwn === true` e `profile.role === 'creator'`**, uma nova seção abaixo do grid de seguindo/assinaturas com:

**Grade de posts** (estilo Instagram — 3 colunas):
- Miniatura da mídia (imagem ou ícone de vídeo)
- Post sem mídia: mostra balão de texto
- Em cada post: badge do nível de acesso (🌐 Todos / 💖 Fã / 🔥 Super Fã / 💎 VIP)
- Ao passar o mouse: overlay com botões de **Editar** e **Excluir**

**Modal de Edição:**
- Campo de textarea para editar legenda
- Select para alterar nível de acesso mínimo (`free` / `fan` / `superfan` / `vip`)
- Botão "Salvar alterações" — chama `UPDATE posts SET text = ?, min_plan = ? WHERE id = ?`

**Modal de confirmação de Exclusão:**
- Diálogo de alerta pedindo confirmação
- Botão "Excluir" — chama `DELETE FROM posts WHERE id = ?`

### 2. Novo hook `useMyPosts` (dentro de `FanProfile.tsx` ou arquivo separado)

```ts
// Busca os posts do criador logado
const { data: posts } = useQuery({
  queryKey: ["myPosts", id],
  enabled: isOwn && profile?.role === "creator",
  queryFn: async () => supabase
    .from("posts")
    .select("*")
    .eq("creator_id", id)
    .order("created_at", { ascending: false })
})

// Mutation para editar
const editPost = useMutation(...)

// Mutation para excluir
const deletePost = useMutation(...)
```

As políticas RLS existentes já cobrem isso:
- `Creators can update their own posts` → permite UPDATE
- `Creators can delete their own posts` → permite DELETE

---

## Fluxo de interação

```text
Criador acessa /profile/:seuId
         ↓
Seção "Meus Posts" é exibida abaixo do perfil
         ↓
Hover sobre um post → aparecem botões ✏️ Editar e 🗑️ Excluir
         ↓
[Editar] → Abre modal com legenda atual e nível de acesso
           → Salva → UPDATE no banco → cache invalidado → grade atualiza
[Excluir] → Abre alerta de confirmação
           → Confirma → DELETE no banco → cache invalidado → post desaparece
```

---

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/FanProfile.tsx` | Adicionar seção de posts, modais de edição e exclusão, queries e mutations |

Apenas **um arquivo** é modificado. Não há migração de banco de dados.
