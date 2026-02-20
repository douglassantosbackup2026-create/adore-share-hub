
## Pixel do Meta para criadores

Permitir que cada criador configure seu proprio Pixel ID do Meta, para que eventos (como Purchase, ViewContent, InitiateCheckout) sejam disparados tanto para o pixel da plataforma quanto para o pixel do criador.

---

### Como funciona

Quando um evento ocorre (ex: um fan compra uma assinatura), o sistema dispara dois eventos:
1. Para o pixel da plataforma (ja existente)
2. Para o pixel do criador (se configurado)

---

### Alteracoes necessarias

**1. Armazenar o Pixel ID do criador**

Usar o campo `social_links` (jsonb) da tabela `profiles` para guardar o `meta_pixel_id`. Nao precisa de migracao -- o campo ja aceita qualquer JSON.

**2. Settings -- nova secao "Pixel do Meta" (src/pages/Settings.tsx)**

Na aba "Perfil" ou como nova aba, adicionar um campo de input para o criador informar seu Pixel ID e Access Token do Meta (CAPI). Os dados serao salvos em `social_links.meta_pixel_id` e `social_links.meta_access_token`.

**3. Atualizar a edge function `meta-capi` (supabase/functions/meta-capi/index.ts)**

Aceitar parametros opcionais `creator_pixel_id` e `creator_access_token`. Se fornecidos, alem de disparar para o pixel da plataforma, disparar um segundo evento identico para o pixel do criador.

**4. Atualizar `sendMetaEvent` (src/lib/metaCapi.ts)**

Adicionar parametros opcionais `creator_pixel_id` e `creator_access_token` na interface. Os chamadores que sabem o criador (PixPaymentModal, CreatorProfile) passarao esses dados.

**5. Atualizar os chamadores**

- `PixPaymentModal.tsx`: receber `creatorPixelId` e `creatorAccessToken` como props (vindos do perfil do criador) e passar para `sendMetaEvent`.
- `CreatorProfile.tsx`: buscar o pixel do criador no perfil carregado e passar nos eventos ViewContent e InitiateCheckout.
- `syncpay-webhook`: o webhook ja chama meta-capi; sera atualizado para buscar o perfil do criador e incluir o pixel dele na chamada.

---

### Detalhes tecnicos

**Campo em `social_links`:**
```json
{
  "instagram": "...",
  "twitter": "...",
  "youtube": "...",
  "meta_pixel_id": "1234567890",
  "meta_access_token": "EAABs..."
}
```

**Edge function `meta-capi` -- logica dupla:**
```
1. Disparar evento para PIXEL_ID da plataforma (hardcoded)
2. Se creator_pixel_id + creator_access_token presentes:
   - Disparar mesmo evento para o pixel do criador
```

**UI em Settings:**
- Campo "Pixel ID do Meta" com placeholder "Ex: 1234567890"
- Campo "Token de acesso (CAPI)" com placeholder e link de ajuda
- Salvo junto com as outras social_links no handleSaveProfile

---

### Resumo dos arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/Settings.tsx` | Campos para Pixel ID e Access Token na aba perfil |
| `src/lib/metaCapi.ts` | Parametros opcionais creator_pixel_id e creator_access_token |
| `supabase/functions/meta-capi/index.ts` | Disparo duplo: plataforma + criador |
| `src/components/PixPaymentModal.tsx` | Passar pixel do criador para sendMetaEvent |
| `src/pages/CreatorProfile.tsx` | Passar pixel do criador nos eventos ViewContent/InitiateCheckout |
| `supabase/functions/syncpay-webhook/index.ts` | Buscar pixel do criador e incluir na chamada meta-capi |

Nenhuma migracao de banco necessaria -- o campo `social_links` (jsonb) ja suporta dados adicionais.
