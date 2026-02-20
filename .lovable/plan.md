

## Sistema de Afiliados

Criar um programa de afiliados onde qualquer usuario pode compartilhar um link de referencia para um criador. Quando alguem assina atraves desse link, o afiliado recebe uma comissao definida pelo admin.

---

### Banco de dados (novas tabelas)

**1. `platform_settings`** -- configuracoes globais da plataforma

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| key | text (unique) | -- |
| value | text | -- |
| updated_at | timestamptz | now() |

Armazenara `affiliate_fee_rate` com valor inicial `"0.05"` (5%). O admin altera esse valor pelo painel. RLS: leitura publica, escrita apenas para admins.

**2. `affiliate_links`** -- links de referencia

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| affiliate_id | uuid | -- (quem compartilha) |
| creator_id | uuid | -- (criador sendo promovido) |
| code | text (unique) | -- (codigo curto, ex: "abc123") |
| created_at | timestamptz | now() |

RLS: usuarios autenticados podem criar/ver seus proprios links.

**3. `affiliate_referrals`** -- registro de conversoes

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| affiliate_link_id | uuid | FK -> affiliate_links |
| subscription_id | uuid | FK -> subscriptions |
| commission_rate | numeric | -- (taxa no momento da conversao) |
| commission_amount | numeric | -- (valor calculado) |
| status | text | 'pending' |
| created_at | timestamptz | now() |

RLS: afiliados podem ver seus proprios referrals.

---

### Painel Admin -- nova secao "Afiliados"

Adicionar uma nova secao na sidebar do Admin com:

1. **Card de configuracao**: slider ou input para definir a porcentagem do afiliado (0% a 50%). Salva em `platform_settings` com key `affiliate_fee_rate`.

2. **Tabela de afiliados ativos**: lista de usuarios com links de afiliado, mostrando:
   - Nome do afiliado
   - Quantidade de links gerados
   - Total de conversoes
   - Comissao total acumulada

3. **Tabela de conversoes recentes**: ultimas assinaturas feitas via link de afiliado.

---

### Fluxo do afiliado

1. Na pagina do criador (`CreatorProfile.tsx`), adicionar um botao "Compartilhar como afiliado" que gera um link unico (ex: `?ref=abc123`).
2. Quando um fan acessa o link, o codigo `ref` e salvo em sessionStorage.
3. No momento da assinatura (checkout Pix), o sistema verifica se ha um codigo de referencia e registra o `affiliate_referral` com a comissao calculada.

---

### Distribuicao da receita (exemplo com afiliado a 5%)

De uma assinatura de R$ 100:
- Plataforma: 20% = R$ 20
- Afiliado: 5% = R$ 5 (deduzido da parte da plataforma)
- Criador: 80% = R$ 80 (nao muda)

A comissao do afiliado sai da parte da plataforma, ou seja, a plataforma fica com 15% e o afiliado com 5%. O criador sempre recebe 80%.

---

### Resumo dos arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Migracao SQL | Criar tabelas `platform_settings`, `affiliate_links`, `affiliate_referrals` com RLS |
| `src/pages/Admin.tsx` | Nova secao "Afiliados" com config de taxa e tabelas |
| `src/lib/constants.ts` | Exportar key `AFFILIATE_FEE_KEY` |
| `src/pages/CreatorProfile.tsx` | Botao "Compartilhar como afiliado" + captura de `?ref=` |
| `src/components/PixPaymentModal.tsx` | Verificar ref no sessionStorage e registrar referral |
| `supabase/functions/syncpay-webhook/index.ts` | Ao confirmar pagamento, criar registro em `affiliate_referrals` |
| `src/hooks/useAffiliateLinks.ts` (novo) | Hook para CRUD de links de afiliado |
| `src/hooks/useAffiliateStats.ts` (novo) | Hook para admin ver estatisticas de afiliados |
| `src/pages/Settings.tsx` | Nova aba ou secao "Afiliados" para o criador/usuario ver seus links e ganhos |

