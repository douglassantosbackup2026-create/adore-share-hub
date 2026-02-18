
# 4 Melhorias: Gráfico real, Onboarding do criador, Landing com criadores reais, Preview do post

## O que cada melhoria resolve

| Problema | Causa raiz | Solução |
|---|---|---|
| Gráfico hardcoded | `revenueData` é array estático no topo do arquivo | Nova função RPC no banco + hook que soma receita por mês |
| Onboarding ausente | Após signup, criador vai direto ao feed sem configurar nada | Nova página `/onboarding` só para criadores recém-criados |
| Landing com dados mock | `Index.tsx` usa `mockCreators.slice(0, 4)` sem consultar banco | `useCreators()` já filtra criadores com posts — só substituir a fonte |
| Sem preview do post | O upload aciona publicação diretamente no `onChange` | Adicionar estado de "rascunho" com modal de preview antes de confirmar |

---

## 1. Gráfico de receita real

**Banco de dados — nova função RPC:**

A abordagem correta (conforme a boa prática) é agregar os dados no banco, não no cliente. A função calcula, para cada um dos últimos 6 meses, quantas assinaturas ativas o criador tinha e qual era o preço de cada plano — resultando na receita estimada por mês.

```sql
CREATE OR REPLACE FUNCTION get_creator_monthly_revenue(p_creator_id uuid)
RETURNS TABLE (month text, value numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    TO_CHAR(generate_series, 'Mon', 'pt_BR') AS month,
    COALESCE((
      SELECT SUM(cp.price)
      FROM subscriptions s
      JOIN creator_plans cp ON cp.creator_id = s.creator_id
        AND cp.plan_name = s.plan
      WHERE s.creator_id = p_creator_id
        AND s.active = true
        AND DATE_TRUNC('month', s.created_at) <= generate_series
    ), 0) AS value
  FROM generate_series(
    DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
    DATE_TRUNC('month', NOW()),
    INTERVAL '1 month'
  )
  ORDER BY generate_series;
$$;
```

**Hook `useMonthlyRevenue(creatorId)`** — novo arquivo `src/hooks/useMonthlyRevenue.ts`:
- Chama `supabase.rpc('get_creator_monthly_revenue', { p_creator_id })` 
- Retorna `{ data, isLoading }`

**Dashboard.tsx:**
- Remove a constante `revenueData` hardcoded (linhas 20–27)
- Importa e usa `useMonthlyRevenue(user?.id)` 
- Passa os dados reais para o `<AreaChart>`
- Enquanto carrega: skeleton animado no lugar do gráfico

---

## 2. Onboarding do criador

**Nova rota `/onboarding`** — acessível apenas para criadores.

**Fluxo:**

```text
Signup como criador
       ↓
  navigate("/onboarding")   ← em vez de "/feed"
       ↓
┌─────────────────────────────────────┐
│  Boas-vindas, [Nome]!               │
│  Complete seu perfil para começar   │
│                                     │
│  [Foto de perfil]  [Foto de capa]   │
│  Bio .............................   │
│  Preço Fã: R$ ___                   │
│  Preço Super Fã: R$ ___             │
│  Preço VIP: R$ ___                  │
│                                     │
│  [Ir para o Dashboard →]            │
└─────────────────────────────────────┘
```

**Arquivos afetados:**

- `src/pages/Onboarding.tsx` — nova página:
  - Upload de avatar/capa (igual ao Settings)
  - Textarea para bio
  - 3 inputs de preço (fan, superfan, vip)
  - Ao salvar: update em `profiles` + upsert em `creator_plans` → navega para `/dashboard`
  - Botão "Pular por agora" → vai direto para `/dashboard`

- `src/pages/Signup.tsx` — alterar o `navigate` após signup bem-sucedido:
  - Se `role === "creator"` → `navigate("/onboarding")`
  - Se `role === "fan"` → `navigate("/feed")` (mantém atual)

- `src/App.tsx` — nova rota:
  ```tsx
  <Route path="/onboarding" element={<CreatorRoute><Onboarding /></CreatorRoute>} />
  ```

---

## 3. Landing page com criadores reais

**Index.tsx:**
- Adiciona `import { useCreators } from "@/hooks/useCreators"` 
- `const { data: realCreators } = useCreators()` dentro do componente
- `const featured = realCreators?.length ? realCreators.slice(0, 4) : mockCreators.slice(0, 4)`
- A seção "Criadores populares" exibe os criadores ordenados por `subscribers` (maior primeiro):
  ```ts
  const featured = [...(realCreators ?? [])]
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 4);
  ```
- Se não há criadores reais ainda, cai de volta para os mocks (comportamento atual)

Essa mudança é simples — `useCreators` já faz todo o trabalho pesado e já filtra quem tem posts.

---

## 4. Preview do post antes de publicar

**Dashboard.tsx — estado de rascunho:**

Adicionar estado `previewFile` e um modal de confirmação antes de publicar:

```text
Criador preenche legenda + seleciona plano
         ↓
  Clica na área de upload
         ↓
  Seleciona arquivo → arquivo entra em estado de "rascunho"
         ↓
┌──────────────────────────────────────┐
│  Preview do post                     │
│                                      │
│  [thumbnail da imagem/vídeo]         │
│  Legenda: "..."                      │
│  Acesso: Fã                          │
│                                      │
│  [Cancelar]     [Publicar agora →]   │
└──────────────────────────────────────┘
         ↓
  Clica "Publicar" → upload + insert no banco
```

**Implementação:**
- Adicionar estado: `previewFile: File | null`, `previewUrl: string | null`, `previewOpen: boolean`
- No `onChange` do input: em vez de chamar `handleUpload` diretamente, setar o arquivo em estado e abrir o modal
- Usar o componente `Dialog` já disponível no projeto (`src/components/ui/dialog.tsx`)
- No modal: `<img>` ou `<video>` com `src={previewUrl}` (via `URL.createObjectURL(file)`)
- Botão "Publicar agora" no modal executa o upload real
- Limpa o `previewUrl` com `URL.revokeObjectURL` ao fechar/publicar

---

## Resumo das mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| Banco de dados | Nova função RPC `get_creator_monthly_revenue` |
| `src/hooks/useMonthlyRevenue.ts` | Novo hook que chama a RPC |
| `src/pages/Dashboard.tsx` | Remove hardcode, usa `useMonthlyRevenue`, adiciona modal de preview |
| `src/pages/Signup.tsx` | Redireciona criador para `/onboarding` |
| `src/pages/Onboarding.tsx` | Nova página de onboarding |
| `src/pages/Index.tsx` | Usa `useCreators()` ordenado por assinantes |
| `src/App.tsx` | Nova rota `/onboarding` |
