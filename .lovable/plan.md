
# Adicionar Evento Purchase na Meta Conversions API

## Situação atual

O fluxo de assinatura em `CreatorProfile.tsx` já possui dois eventos rastreados:
- `ViewContent` — ao carregar o perfil do criador
- `InitiateCheckout` — ao clicar no botão "Assinar" (antes da tentativa)

Falta apenas o `Purchase`, que deve ser disparado **somente após a assinatura ser confirmada com sucesso** no banco de dados.

## O que será alterado

### Arquivo: `src/pages/CreatorProfile.tsx`

Dentro da função `handleSubscribe`, após `await subscribe.mutateAsync(...)` retornar com sucesso e antes de chamar `toast.success(...)`, adicionar a chamada:

```ts
sendMetaEvent({
  event_name: "Purchase",
  user_email: user.email,
  value: plans[selectedPlan].price,
  currency: "BRL",
});
```

Sequência final do fluxo:

```
Clique em "Assinar"
    → [Meta] InitiateCheckout (com valor do plano)
    → subscribe.mutateAsync() — grava no banco
        → sucesso → [Meta] Purchase (com valor do plano) ← NOVO
                  → toast.success("Assinatura realizada com sucesso!")
        → erro    → toast.error(...)
```

Nenhum outro arquivo precisa ser alterado — a edge function `meta-capi` e o helper `sendMetaEvent` já suportam o evento `Purchase` com os parâmetros `value` e `currency`.

## Resumo

| Arquivo | Alteração |
|---|---|
| `src/pages/CreatorProfile.tsx` | Adicionar `sendMetaEvent({ event_name: "Purchase", ... })` no `onSuccess` do subscribe |
