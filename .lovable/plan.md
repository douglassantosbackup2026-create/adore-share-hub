
# Corrigir Build + Integrar Meta Conversions API

## Dois problemas a resolver

### Problema 1: Erro de Build (noscript no head)

O HTML5 não permite tags `<img>` dentro de `<noscript>` no `<head>`. A correção é mover o bloco `<noscript>` para o `<body>`, logo após a abertura da tag:

```html
<body>
  <noscript>
    <img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=4384406811885630&ev=PageView&noscript=1"
    />
  </noscript>
  <div id="root"></div>
  ...
</body>
```

### Problema 2: Token da Meta Ads API

O token fornecido é uma credencial de acesso à **Meta Conversions API (CAPI)** — a versão server-side do rastreamento. Isso permite enviar eventos (cadastro, assinatura, compra) diretamente do servidor para o Meta, complementando o pixel do navegador.

**O token NUNCA deve ficar no código-fonte.** Será armazenado com segurança como um secret do backend e usado apenas dentro de uma função de backend.

---

## O que será implementado

### Etapa 1: Corrigir `index.html`
- Mover `<noscript>` do `<head>` para o `<body>` — resolve o erro de build.

### Etapa 2: Armazenar o token com segurança
- Guardar o token (`EAAXIx...`) como secret `META_CAPI_TOKEN` no backend seguro — ele nunca ficará visível no código.

### Etapa 3: Criar Edge Function `meta-capi`
Uma função de backend que recebe eventos da aplicação e os encaminha para a Meta Conversions API:

```
POST /meta-capi
{
  "event_name": "Lead",        // ou Purchase, CompleteRegistration, etc.
  "user_email": "...",         // para matching de usuário (hasheado automaticamente)
  "value": 29.90               // opcional, para eventos de compra
}
```

A função usa o `META_CAPI_TOKEN` e o Pixel ID `4384406811885630` para enviar para:
`https://graph.facebook.com/v18.0/4384406811885630/events`

### Etapa 4: Disparar eventos nas ações relevantes
Adicionar chamadas à edge function nos momentos-chave:

| Ação do usuário | Evento Meta |
|---|---|
| Cadastro concluído | `CompleteRegistration` |
| Clicar em assinar | `InitiateCheckout` |
| Visitar perfil de criador | `ViewContent` |

---

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `index.html` | Mover `<noscript>` para o `<body>` |
| Backend secret | Adicionar `META_CAPI_TOKEN` |
| `supabase/functions/meta-capi/index.ts` | Criar edge function |
| `src/pages/Signup.tsx` | Disparar `CompleteRegistration` |
| `src/pages/CreatorProfile.tsx` | Disparar `ViewContent` |

---

## Segurança

O token nunca ficará exposto ao navegador. Toda comunicação com a Meta Conversions API ocorre servidor → servidor, dentro da edge function protegida.
