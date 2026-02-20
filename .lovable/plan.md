

## Aprovacao de Afiliados pelo Admin

Atualmente, qualquer usuario logado pode gerar links de afiliado livremente. Com esta mudanca, o admin precisara aprovar cada afiliado antes que seus links funcionem.

---

### Como vai funcionar

1. Quando um usuario clica em "Compartilhar como afiliado" no perfil de um criador, uma **solicitacao de afiliado** e criada com status pendente.
2. O admin ve as solicitacoes pendentes na aba "Afiliados" do painel e pode aprovar ou rejeitar.
3. Somente apos aprovacao o usuario pode gerar links de afiliado e receber comissoes.
4. Usuarios pendentes ou nao-aprovados veem uma mensagem informando que precisam aguardar aprovacao.

---

### Detalhes tecnicos

**Migracao SQL:**
- Adicionar coluna `approved` (boolean, default `false`) na tabela `affiliate_links`. Essa coluna sera usada de forma diferente: vamos criar uma nova tabela `affiliate_requests` para controlar quem pode ser afiliado.

Na verdade, a abordagem mais limpa:

**Nova tabela `affiliate_requests`:**

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| user_id | uuid (unique) | -- |
| status | text | 'pending' |
| created_at | timestamptz | now() |
| reviewed_at | timestamptz | null |

- `status` pode ser `pending`, `approved` ou `rejected`
- RLS: usuarios podem ver/criar seus proprios pedidos; admins podem ver e atualizar todos

**Fluxo atualizado:**

1. No `CreatorProfile.tsx`, ao clicar em "Afiliado":
   - Verificar se o usuario ja tem um `affiliate_request`
   - Se nao tem: criar com status `pending` e mostrar mensagem "Sua solicitacao foi enviada"
   - Se tem e esta `pending`: mostrar "Aguardando aprovacao"
   - Se tem e esta `approved`: gerar o link normalmente (comportamento atual)
   - Se tem e esta `rejected`: mostrar "Sua solicitacao foi negada"

2. No `Admin.tsx` (aba Afiliados):
   - Nova secao "Solicitacoes Pendentes" mostrando nome do usuario e data
   - Botoes "Aprovar" e "Rejeitar" para cada solicitacao

3. No webhook (`syncpay-webhook`): ao registrar referral, verificar se o afiliado esta aprovado antes de criar o registro de comissao.

---

### Resumo dos arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Migracao SQL | Criar tabela `affiliate_requests` com RLS |
| `src/hooks/useAffiliateLinks.ts` | Verificar aprovacao antes de permitir criar links |
| `src/hooks/useAffiliateStats.ts` | Novo hook `useAffiliateRequests` para admin listar/aprovar/rejeitar |
| `src/pages/Admin.tsx` | Secao de solicitacoes pendentes na aba Afiliados |
| `src/pages/CreatorProfile.tsx` | Verificar status do afiliado antes de gerar link |
| `supabase/functions/syncpay-webhook/index.ts` | Verificar se afiliado esta aprovado antes de registrar comissao |

