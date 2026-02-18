
# Atualizar credenciais do Meta Pixel / CAPI

## O que muda

Duas credenciais precisam ser atualizadas:

| Campo | Valor atual | Valor novo |
|---|---|---|
| Pixel ID | `4384406811885630` | `1688353905856977` |
| Token de acesso (META_CAPI_TOKEN) | token antigo (secret) | novo token fornecido |

---

## Arquivos alterados

### 1. `supabase/functions/meta-capi/index.ts`
- Linha 9: trocar `PIXEL_ID = "4384406811885630"` por `PIXEL_ID = "1688353905856977"`

### 2. Secret `META_CAPI_TOKEN`
- Atualizar o secret com o novo token via ferramenta de secrets
- O token nunca entra no código — fica armazenado com segurança no backend

---

## Sequência de execução

```text
1. Atualizar o secret META_CAPI_TOKEN com o novo token
2. Atualizar PIXEL_ID no código da edge function
3. Fazer redeploy da função meta-capi
```

A função será reimplantada automaticamente e todos os eventos futuros (PageView, Purchase, etc.) passarão a ser enviados para o novo Pixel com o novo token.
