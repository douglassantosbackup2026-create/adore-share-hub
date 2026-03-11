

## Melhorias de UX — Plano de Implementacao

### 1. Loading States (Skeletons) nas paginas principais

**Arquivos:** `Feed.tsx`, `Discover.tsx`, `CreatorProfile.tsx`

- Criar componente `PostSkeleton` reutilizavel (card com pulsos animados para avatar, texto, imagem)
- Criar `CreatorCardSkeleton` para o grid do Discover
- No Feed: mostrar 3 `PostSkeleton` enquanto `usePosts` esta carregando, e skeletons nos stories
- No Discover: mostrar grid de 8 `CreatorCardSkeleton` enquanto `useCreators` carrega
- No CreatorProfile: skeleton para cover/avatar/stats enquanto `useCreatorProfile` carrega
- Usar o componente `Skeleton` ja existente em `src/components/ui/skeleton.tsx`

### 2. Busca global funcional na Navbar

**Arquivos:** `Navbar.tsx` (novo componente `SearchDialog.tsx`)

- Criar `SearchDialog` usando `CommandDialog` (cmdk ja instalado em `src/components/ui/command.tsx`)
- Ao clicar no icone de busca na Navbar, abrir o dialog
- Buscar criadores na tabela `profiles` (role=creator) e posts em `posts` via Supabase
- Exibir resultados agrupados (Criadores / Posts) com links para `/creator/:id` ou scroll ao post
- Suportar atalho Ctrl+K para abrir
- Debounce de 300ms na digitacao

### 3. Sugestoes mobile no Feed

**Arquivo:** `Feed.tsx`

- Adicionar uma faixa horizontal scrollavel de sugestoes logo abaixo dos stories (visivel apenas em telas < lg)
- Reutilizar os dados de `suggestions` ja existentes
- Renderizar cards compactos (avatar + nome + botao seguir) em scroll horizontal
- Classe: `flex lg:hidden` para aparecer apenas no mobile

### 4. Onboarding do fa

**Arquivos:** novo `src/pages/FanOnboarding.tsx`, `AuthContext.tsx`, `App.tsx`

- Nova rota `/fan-onboarding` protegida
- Apos signup como fan, redirecionar para `/fan-onboarding` em vez de `/feed`
- Pagina com 2 etapas:
  1. Escolher categorias de interesse (pills selecionaveis das mesmas categorias do Discover)
  2. Lista de criadores sugeridos com base nas categorias, com botao "Seguir" (usando `useFollow`)
- Botao "Pular" sempre visivel
- Ao concluir, navegar para `/feed`
- Marcar onboarding completo via `localStorage` (chave `fan_onboarded`) para nao repetir

### 5. Compartilhamento de posts

**Arquivo:** `Feed.tsx`

- No botao `Share2` do post, implementar:
  1. Se `navigator.share` disponivel (mobile): usar Web Share API com titulo + URL do post (`/creator/:creatorId`)
  2. Senao: copiar link para clipboard com `navigator.clipboard.writeText` e mostrar toast "Link copiado!"
- Criar funcao `handleShare(post)` que gera a URL e dispara a acao

### Resumo de arquivos modificados/criados

| Arquivo | Acao |
|---|---|
| `src/components/PostSkeleton.tsx` | Criar |
| `src/components/CreatorCardSkeleton.tsx` | Criar |
| `src/components/SearchDialog.tsx` | Criar |
| `src/pages/FanOnboarding.tsx` | Criar |
| `src/pages/Feed.tsx` | Editar (skeletons, sugestoes mobile, share) |
| `src/pages/Discover.tsx` | Editar (skeletons) |
| `src/pages/CreatorProfile.tsx` | Editar (skeletons) |
| `src/components/Navbar.tsx` | Editar (integrar SearchDialog) |
| `src/pages/Signup.tsx` | Editar (redirecionar fan para /fan-onboarding) |
| `src/App.tsx` | Editar (nova rota /fan-onboarding) |

