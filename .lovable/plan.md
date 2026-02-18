

# Preparar a Plataforma para Criadores Reais

## Situacao Atual

A base esta funcional: cadastro com roles, perfil, upload de conteudo, planos e mensagens estao conectados ao banco. Porem, ha lacunas criticas que precisam ser resolvidas antes de receber criadores reais.

---

## Problemas Criticos a Resolver

### 1. Controle de Acesso por Role nas Rotas
Atualmente, qualquer usuario logado (inclusive fas) pode acessar `/dashboard` e `/settings` (aba de planos). Criadores precisam de rotas exclusivas.

**Solucao:** Criar um componente `CreatorRoute` que verifica `profile.role === "creator"` e redireciona fas para `/feed`.

### 2. Bucket "content" e Privado mas Codigo Usa `getPublicUrl`
O bucket `content` nao e publico, entao `getPublicUrl` retorna URLs que nao funcionam. Criadores nao conseguirao ver seu proprio conteudo publicado.

**Solucao:** Trocar para URL publica (tornar bucket publico) ou usar `createSignedUrl` para gerar links temporarios. Como se trata de conteudo de criadores visivel para assinantes, tornar o bucket publico (igual avatars/covers) e a opcao mais simples -- a protecao de acesso ao conteudo ja e feita via RLS nos posts.

### 3. Falta Upload de Capa nas Configuracoes
O Settings so permite upload de avatar. Criadores precisam tambem trocar a imagem de capa do perfil.

**Solucao:** Adicionar campo de upload de capa no Settings, usando o bucket `covers`.

### 4. Post Sempre Criado como "free" -- Sem Selecao de Plano Minimo
No Dashboard, ao publicar conteudo, o `min_plan` e sempre `"free"`. Criadores precisam poder escolher qual plano minimo tem acesso ao post (Fa, Super Fa, VIP).

**Solucao:** Adicionar um seletor de plano minimo no formulario de publicacao do Dashboard.

### 5. Redirecionamento Pos-Login para Criadores
Apos login, todos os usuarios vao para `/feed`. Criadores deveriam ir para `/dashboard`.

**Solucao:** No fluxo de login, verificar o role do perfil e redirecionar criadores para `/dashboard`.

### 6. Perfil do Criador Usa IDs Numericos (Mock) como Fallback
A pagina `/creator/:id` tenta buscar por ID numerico nos mocks quando o real nao e encontrado. Criadores reais tem UUIDs.

**Solucao:** Remover fallback para mock quando ha dados reais. Mostrar estado vazio/404 se o criador nao existir.

---

## Melhorias Secundarias (nao bloqueantes, mas recomendadas)

### 7. Stories e Sugestoes Usam Mock Fixo
A secao de stories e sugestoes no Feed usa dados mock sempre. Deveria usar criadores reais quando disponiveis.

### 8. Grafico de Receita e Estatico
O grafico de receita no Dashboard mostra dados fixos. Idealmente calcularia a partir do historico de assinaturas.

---

## Plano de Implementacao

### Etapa 1: CreatorRoute (protecao de rotas)
- Criar `src/components/CreatorRoute.tsx` que verifica `profile.role === "creator"`
- Envolver `/dashboard` e `/settings` com `CreatorRoute` no `App.tsx`

### Etapa 2: Corrigir bucket de conteudo
- Alterar bucket `content` para publico via migration/config, ou usar signed URLs no codigo

### Etapa 3: Upload de capa no Settings
- Adicionar secao de upload de capa no tab "Perfil" do Settings
- Upload para bucket `covers` + update `cover_url` em profiles

### Etapa 4: Seletor de plano minimo no Dashboard
- Adicionar select com opcoes "Todos (free)", "Fa", "Super Fa", "VIP" antes do upload
- Passar o valor selecionado no INSERT do post

### Etapa 5: Redirecionamento por role no Login
- No `Login.tsx`, apos login bem-sucedido, buscar profile e redirecionar criadores para `/dashboard`

### Etapa 6: Remover fallback mock no CreatorProfile
- Se `useCreatorProfile` nao retornar dados, mostrar pagina 404 em vez de mock
- Manter mocks apenas na pagina Discover quando nao ha criadores reais

### Etapa 7: Stories e sugestoes reais no Feed
- Usar `useCreators()` para popular stories e sugestoes no Feed

---

## Resumo de Arquivos

**Criar:**
- `src/components/CreatorRoute.tsx`

**Modificar:**
- `src/App.tsx` (usar CreatorRoute)
- `src/pages/Dashboard.tsx` (seletor min_plan)
- `src/pages/Settings.tsx` (upload de capa)
- `src/pages/Login.tsx` (redirect por role)
- `src/pages/CreatorProfile.tsx` (remover fallback mock)
- `src/pages/Feed.tsx` (stories/sugestoes reais)

**Possivel migration:**
- Tornar bucket `content` publico (se necessario via SQL/config)
