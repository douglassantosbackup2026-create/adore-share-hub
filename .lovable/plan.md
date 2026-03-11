

## Corrigir carregamento de dados para visitantes não logados

### Causa raiz

A política RLS da tabela `posts` chamada **"Authenticated users can view free posts"** exige `auth.uid() IS NOT NULL`, o que bloqueia completamente visitantes não autenticados de ver qualquer post -- mesmo os gratuitos. Como a feature anterior (mostrar posts gratuitos para visitantes) depende disso, nenhum dado aparece.

### Plano

**1. Atualizar a política RLS de posts gratuitos (migração SQL)**

Substituir a política atual por uma que permita acesso anônimo a posts com `min_plan = 'free'`:

```sql
DROP POLICY "Authenticated users can view free posts" ON public.posts;

CREATE POLICY "Anyone can view free posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (min_plan = 'free');
```

Isso permite que visitantes não logados (role `anon`) vejam posts gratuitos, enquanto a política existente "Subscribers can view paid posts" continua restringindo posts pagos a assinantes autenticados.

**2. Nenhuma mudança de código necessária** -- os hooks (`useCreatorProfile`, `usePosts`, `useCreators`) já fazem as queries corretas. O bloqueio é exclusivamente na camada de RLS do banco de dados.

### Resultado

- Visitantes não logados verão posts gratuitos no perfil do criador, feed e discover
- Posts pagos continuam protegidos (só visíveis para assinantes ou o próprio criador)

