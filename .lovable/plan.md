
# Corrigir visualização indevida e clique em posts bloqueados

## Problema 1: Usuário não logado vendo imagens reais

### Causa raiz
O hook `useCreatorProfile` faz a query de posts **sem checar se o usuário está autenticado** (`enabled: !!creatorId` — sem verificar `user`). Isso faz com que a query rode mesmo para visitantes não logados.

O RLS na tabela `posts` bloqueia posts pagos para anônimos, mas **posts `min_plan = 'free'` são retornados pelo banco para anônimos** por causa da policy "Authenticated users can view free posts" que na verdade usa `auth.uid() IS NOT NULL`. Como o Supabase trata sessões anônimas sem token como `null`, posts free não deveriam aparecer — mas pode haver um delay de hidratação do React onde `user` ainda é `null` (carregando) e os posts já chegaram da cache do React Query.

### Correção no frontend (dupla proteção)
1. **`useCreatorProfile`**: adicionar `user` como dependência e desabilitar a query de posts quando `!user`:
   ```ts
   enabled: !!creatorId && !!user
   ```
2. **`CreatorProfile.tsx`**: adicionar verificação do `loading` do auth antes de renderizar o grid — enquanto `loading === true`, não mostrar nem o gate nem o grid (evita flash de conteúdo durante hidratação).

---

## Problema 2: Clicar no post bloqueado não faz nada

### Causa raiz
O `div` do post bloqueado tem `cursor-pointer` mas **nenhum `onClick` handler** definido. O clique não dispara nenhuma ação.

### Correção
Adicionar `onClick` no post bloqueado com dois comportamentos:
- **Usuário não logado**: redirecionar para `/signup` com toast informativo
- **Usuário logado mas sem assinatura**: abrir o `PixPaymentModal` com o plano mais acessível pré-selecionado

---

## Arquivos alterados

### 1. `src/hooks/useCreatorProfile.ts`
- Receber `user` como parâmetro opcional
- Adicionar `!!user` na condição `enabled` da query de posts

### 2. `src/pages/CreatorProfile.tsx`
- Passar `user` para `useCreatorProfile`
- Importar `useNavigate` para redirecionar não logados
- Usar `loading` do `useAuth` para evitar flash de conteúdo durante inicialização
- Adicionar `handleLockedPostClick()`:
  - Se `!user`: `toast.info(...)` + `navigate("/signup")`
  - Se logado mas não assinante: `setPixModalOpen(true)` com plano 0
- Conectar o `onClick` no `div` do post bloqueado

---

## Sequência de execução

```text
1. Atualizar src/hooks/useCreatorProfile.ts (adicionar parâmetro user + enabled guard)
2. Atualizar src/pages/CreatorProfile.tsx (loading guard + onClick nos posts bloqueados)
```

## Resultado esperado

| Estado do usuário | Comportamento |
|---|---|
| Não logado (carregando) | Grid não renderiza (sem flash) |
| Não logado (confirmado) | Gate de cadastro com placeholders |
| Logado, sem assinatura | Posts free visíveis; locked mostram cadeado; clique abre Pix |
| Logado, com assinatura | Todos os posts visíveis |
