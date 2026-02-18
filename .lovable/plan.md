
# Correção dos 3 problemas críticos do Feed

## Problema 1: RLS não aplicada — feed vazio para não-assinantes

Confirmado pela análise do banco: a política "Authenticated users can see all posts in feed" não existe. As únicas políticas SELECT atuais na tabela `posts` são:
- "Anyone can view free posts" — só mostra `min_plan = 'free'`
- "Subscribers can view paid posts" — só mostra se tiver assinatura ativa

Precisamos adicionar uma terceira política permissiva (as políticas permissivas funcionam com OR):

```sql
CREATE POLICY "Authenticated users can see all posts in feed"
ON public.posts FOR SELECT
TO authenticated
USING (true);
```

Isso faz o feed carregar todos os posts para qualquer usuário logado. O bloqueio visual (blur + cadeado) continua sendo feito no frontend pelo `locked: p.min_plan !== "free" && !mySubscriptions.has(p.creator_id)`.

---

## Problema 2: "Assinar para ver" redireciona para o perfil em vez de abrir modal de pagamento

Atualmente em `Feed.tsx` (linha 174-179):
```tsx
<Link to={`/creator/${post.creator.id}`}>
  Assinar para ver
</Link>
```

Precisamos transformar isso num botão que abre o `PixPaymentModal` diretamente, com as informações do plano mais barato do criador pré-carregadas.

**Mudanças necessárias em `Feed.tsx`:**
1. Importar `PixPaymentModal` e `useState` para controlar qual post está com o modal aberto
2. Adicionar estado: `const [pixModal, setPixModal] = useState<{ creatorId: string; creatorName: string; planName: string; amount: number } | null>(null)`
3. Buscar os planos dos criadores junto com os posts (já disponível via `useCreatorProfile`, mas precisamos de um hook leve para pegar o plano mais barato por `creator_id`)
4. Substituir o `<Link>` por um `<button>` que dispara `setPixModal(...)` com os dados do plano mais barato
5. Renderizar o `<PixPaymentModal>` no final do componente

Para evitar N queries, vamos buscar os planos de todos os criadores cujos posts aparecem no feed em uma única query, usando o hook `usePosts` já existente que traz `creator_id`.

---

## Problema 3: Comentários — ícone existe mas não faz nada

O ícone de `MessageCircle` em cada post não tem lógica associada. Precisamos:

**Backend (nova tabela `post_comments`):**
```sql
CREATE TABLE public.post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler comentários
CREATE POLICY "Authenticated can view comments"
ON public.post_comments FOR SELECT TO authenticated USING (true);

-- Usuário autenticado comenta com seu próprio ID
CREATE POLICY "Authenticated can insert comments"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Autor pode deletar seu próprio comentário
CREATE POLICY "Author can delete own comments"
ON public.post_comments FOR DELETE TO authenticated
USING (auth.uid() = author_id);
```

**Frontend:**
1. Novo hook `useComments(postId)` — busca comentários + mutation para inserir
2. Em `Feed.tsx`, adicionar estado `openComments: Set<string>` para controlar quais posts têm a seção de comentários aberta
3. Ao clicar no ícone de comentário, toggle da seção abaixo do post
4. Seção de comentários: lista de comentários existentes + campo de texto + botão de enviar

---

## Resumo das mudanças

| Prioridade | O que muda | Onde |
|---|---|---|
| 1 - Urgente | Nova política RLS (migration SQL) | Banco de dados |
| 2 - Alta | Botão "Assinar para ver" abre PIX modal diretamente | `src/pages/Feed.tsx` |
| 2 - Alta | Buscar planos dos criadores do feed para preencher modal | `src/pages/Feed.tsx` |
| 3 - Média | Tabela `post_comments` + RLS | Banco de dados (migration) |
| 3 - Média | Hook `useComments` | `src/hooks/useComments.ts` (novo) |
| 3 - Média | Seção de comentários no feed | `src/pages/Feed.tsx` |

---

## Fluxo após as correções

**Post bloqueado no feed:**
1. Usuário vê post com imagem borrada + cadeado
2. Clica em "Assinar para ver"
3. Modal de pagamento PIX abre diretamente com o plano mais barato do criador
4. Paga → assinatura ativa → post desbloqueado

**Comentários:**
1. Usuário clica no ícone de comentário
2. Seção expande abaixo do post com comentários existentes
3. Campo de texto + botão enviar → comentário salvo no banco
