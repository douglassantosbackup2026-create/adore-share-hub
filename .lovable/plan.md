
# Integração SyncPay (Pix) como Meio de Pagamento

## Visão geral

A SyncPay é um gateway de pagamento brasileiro via Pix. A integração funciona assim:

1. Fã clica em "Assinar" → backend gera uma cobrança Pix na SyncPay
2. App exibe o QR Code e código copia-e-cola para o fã
3. Fã paga via app do banco
4. SyncPay envia um webhook confirmando o pagamento
5. Webhook ativa a assinatura no banco e dispara o evento Purchase no Meta

## Fluxo completo

```text
[Fã clica "Assinar"]
       ↓
[Edge Function: syncpay-cashin]
  POST /api/partner/v1/auth-token  → obtém Bearer Token (1h)
  POST /api/partner/v1/cash-in     → gera QR Code Pix
       ↓
[Modal: exibe QR Code + código copia-e-cola]
       ↓
[Fã paga no app do banco]
       ↓
[SyncPay → Webhook → Edge Function: syncpay-webhook]
  status == "completed"?
    → INSERT subscriptions (active=true)
    → sendMetaEvent("Purchase")
       ↓
[Assinatura ativada ✓]
```

## Arquivos e infraestrutura a criar/alterar

### Novos arquivos

| Arquivo | Descrição |
|---|---|
| `supabase/functions/syncpay-cashin/index.ts` | Gera token SyncPay e cria cobrança Pix |
| `supabase/functions/syncpay-webhook/index.ts` | Recebe confirmação de pagamento e ativa assinatura |
| `src/components/PixPaymentModal.tsx` | Modal com QR Code, código copia-e-cola e polling de status |

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/pages/CreatorProfile.tsx` | Botão "Assinar" abre o modal Pix em vez de inserir assinatura diretamente |
| `supabase/config.toml` | Registrar as duas novas edge functions com `verify_jwt = false` |

### Banco de dados

Nova coluna na tabela `subscriptions`: `syncpay_id` (text, nullable) — para rastrear o identificador da transação SyncPay e evitar ativações duplicadas pelo webhook.

## Detalhes técnicos

### Edge Function: `syncpay-cashin`
- Recebe: `{ creator_id, plan_name, amount, fan_id, fan_email, fan_name, fan_cpf }`
- Chama `POST /api/partner/v1/auth-token` com `client_id` + `client_secret` (secrets do backend)
- Chama `POST /api/partner/v1/cash-in` com:
  - `amount`: valor do plano
  - `description`: "Assinatura {nome do criador} - Plano {nome do plano}"
  - `webhook_url`: URL da edge function `syncpay-webhook`
  - `client`: nome, email e CPF do fã (CPF será coletado no modal)
- Retorna: `{ pix_code, identifier }` para o frontend

### Edge Function: `syncpay-webhook`
- Recebe o payload do SyncPay (POST)
- Verifica `data.status === "completed"`
- Lê `metadata` do identifier para descobrir `fan_id`, `creator_id` e `plan`
- Insere na tabela `subscriptions` com `active = true`
- Dispara evento `Purchase` na Meta CAPI

### Modal `PixPaymentModal`
- Campos: nome completo e CPF (obrigatório pela API SyncPay)
- Exibe QR Code como imagem gerada via biblioteca QRCode
- Exibe código copia-e-cola com botão "Copiar"
- Polling a cada 3 segundos no banco verificando se a assinatura foi ativada
- Ao confirmar: fecha modal, toast de sucesso, dispara evento Meta Purchase

### Secrets a configurar (já tenho as credenciais)
- `SYNCPAY_CLIENT_ID` = `b0a0ea41-ac8a-4cff-bef5-f7e39e296c0c`
- `SYNCPAY_CLIENT_SECRET` = `96f1bb8a-ecfb-4724-a379-519945a03e13`

### Observação sobre CPF
A API SyncPay exige os dados do cliente (nome + CPF) para gerar a cobrança. O modal pedirá esses dados no momento do pagamento. O CPF não é armazenado no banco de dados da plataforma — é enviado diretamente à SyncPay.

## Dependência de biblioteca

Para renderizar o QR Code no front: instalar `qrcode.react` (não requer API Key, apenas npm).

## Resultado esperado

- Botão "Assinar" abre modal com formulário (nome + CPF)
- Modal exibe QR Code Pix gerado em tempo real pela SyncPay
- Pagamento detectado automaticamente (sem precisar fechar/reabrir)
- Assinatura ativada somente após pagamento confirmado
- Evento Purchase disparado no Meta automaticamente
