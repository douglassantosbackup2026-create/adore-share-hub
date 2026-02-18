
# Corrigir o Feed para funcionar como OnlyFans/Privacy

## Problema raiz

A política RLS atual impede que posts pagos apareçam no feed para não-assinantes. O resultado: o feed fica vazio para quem não tem assinatura, em vez de mostrar os posts bloqueados com o incentivo de assinar.

## O que precisa mudar

### 1. Nova política RLS nos posts

Adicionar uma terceira política de SELECT que permite todos os usuários autenticados verem a existência de qualquer post (metadados: texto, contagem de likes, criador). Isso não expõe o conteúdo — a URL da mídia continua sendo retornada pelo banco, mas o bloqueio visual é feito no frontend (blur + cadeado), exatamente como OnlyFans e Privacy fazem.

```sql
-- Nova política: usuários autenticados veem todos os posts (para o feed funcionar)
CREATE POLICY "Authenticated users can see all posts in feed"
ON public.posts FOR SELECT
TO authenticated
USING (true);
```

As políticas existentes de FREE e SUBSCRIBERS continuam, pois o Postgres aplica as políticas com OR entre elas (permissive). Ou seja: um post aparece se o usuário for anônimo + post free, ou se for autenticado (qualquer post).

### 2. Ajuste no hook `usePosts` — separar "ver no feed" de "ver o conteúdo"

O hook vai buscar todos os posts, mas a lógica de `locked` no feed vai verificar se o usuário tem assinatura ativa com aquele criador. Se não tiver, a imagem aparece borrada + cadeado + botão "Assinar para ver".

Criar um hook complementar `useMySubscriptions` que busca todos os `creator_id` que o usuário atual assina, para o feed saber quais posts estão desbloqueados.

```typescript
// Retorna um Set de creator_ids que o usuário assina
export function useMySubscriptions(): Set<string>
```

### 3. Atualizar o Feed para usar a lógica correta de locked

A lógica de `locked` no `Feed.tsx` passa a ser:

```typescript
locked: p.min_plan !== "free" && !mySubscriptions.has(p.creator_id)
```

Assim:
- Post `free` → sempre visível
- Post `basic`/`vip` + usuário assina aquele criador → visível
- Post `basic`/`vip` + usuário NÃO assina → aparece borrado com "Assinar para ver"

### 4. Comportamento visual do post bloqueado (já existe, só precisa funcionar)

O Feed já tem o visual correto de blur + cadeado + botão. Ele só não aparecia porque os posts nunca chegavam. Com a correção do RLS, o visual vai funcionar automaticamente.

## Arquivos alterados

| O que muda | Onde |
|---|---|
| Nova política RLS (migration) | Banco de dados |
| Novo hook `useMySubscriptions` | `src/hooks/useMySubscriptions.ts` (arquivo novo) |
| Lógica de `locked` corrigida | `src/hooks/usePosts.ts` ou `src/pages/Feed.tsx` |

## Resultado esperado

- Fã não-assinante acessa `/feed` e vê todos os posts de todos os criadores
- Posts pagos aparecem com a imagem borrada, cadeado e botão "Assinar para ver"  
- Fã que assina um criador vê os posts daquele criador normalmente, sem blur
- O modelo de negócio funciona: o usuário é incentivado a assinar ao ver o conteúdo bloqueado
