
# Mostrar conteúdo somente após cadastro

## Objetivo

Qualquer conteúdo de posts (incluindo os gratuitos) só pode ser visualizado por usuários cadastrados e logados. Visitantes sem conta veem o perfil do criador e os planos de assinatura, mas os posts aparecem bloqueados com um CTA de cadastro.

---

## O que precisa mudar

### 1. Banco de dados — RLS (2 alterações)

**Política removida:**
- `"Anyone can view free posts"` — atualmente usa `USING (min_plan = 'free')`, sem checar autenticação. Qualquer pessoa sem conta pode ler posts gratuitos via API.

**Política removida:**
- `"Authenticated users can see all posts in feed"` — usa `USING (true)`, expõe todo o conteúdo para qualquer usuário logado, inclusive posts pagos sem assinatura.

**Políticas que ficam (sem alteração):**
- `"Subscribers can view paid posts"` — já requer `auth.uid()` e assinatura ativa.
- `"Creators can insert/update/delete their own posts"` — intocadas.

**Novas políticas adicionadas:**

```sql
-- Posts gratuitos: só quem está autenticado vê
CREATE POLICY "Authenticated users can view free posts"
ON public.posts FOR SELECT
USING (auth.uid() IS NOT NULL AND min_plan = 'free');
```

Com isso, a lógica de acesso fica:
- **Não logado** → não vê nenhum post (nem gratuito)
- **Logado sem assinatura** → vê posts gratuitos, posts pagos bloqueados no frontend
- **Assinante ativo** → vê todos os posts do criador assinado
- **O próprio criador** → vê todos os seus posts (coberto pela policy de subscriber com `creator_id = auth.uid()`)

---

### 2. Frontend — `src/pages/CreatorProfile.tsx`

A grade de posts precisar tratar o visitante não logado. Em vez de exibir 9 posts mockados (3 "desbloqueados" e 6 bloqueados), o comportamento será:

**Usuário não logado:**
- A grid exibe um overlay de bloqueio em TODOS os posts com mensagem "Crie sua conta para ver o conteúdo" e botão "Cadastrar agora" → redireciona para `/signup`.

**Usuário logado sem assinatura:**
- Posts gratuitos aparecem normalmente; posts pagos mostram o cadeado.

**Usuário assinante:**
- Todos os posts do criador aparecem desbloqueados.

A grade também será atualizada para usar os posts reais do banco (`realPosts`), substituindo o array `lockedPosts` hardcoded, conforme já discutido anteriormente. Isso resolve os dois problemas ao mesmo tempo.

---

### 3. Frontend — `src/pages/Feed.tsx`

O Feed já está por trás de `<ProtectedRoute>`, então só usuários logados chegam lá. Nenhuma alteração necessária.

---

### 4. Frontend — `src/pages/Discover.tsx` e `src/pages/Index.tsx`

Essas páginas mostram **cards de criadores** (nome, avatar, categoria, preço), não o conteúdo dos posts. Perfis são públicos (policy `"Profiles are viewable by everyone"`), então essas páginas continuam funcionando sem login — o que é correto para captação de novos usuários.

---

## Sequência de execução

```text
1. Remover as 2 políticas RLS permissivas no banco
2. Criar nova política "Authenticated users can view free posts"
3. Atualizar CreatorProfile.tsx:
   a. Substituir lockedPosts mockados por realPosts reais
   b. Adicionar overlay de "cadastre-se" para visitantes não logados
```

## Arquivos alterados

- **Banco de dados**: 2 policies removidas, 1 criada
- **`src/pages/CreatorProfile.tsx`**: grid de posts refatorada (dados reais + gate de login para não logados)
