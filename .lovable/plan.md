

## Pixel do criador aparecendo no Meta Pixel Helper

### Problema

O Meta Pixel Helper so detecta pixels inicializados no **navegador** (client-side) via `fbq('init', ...)`. Atualmente, apenas o pixel da plataforma (`1688353905856977`) esta no `index.html`. O pixel do criador so e disparado via CAPI (server-side), que o Pixel Helper nao consegue ver.

### Solucao

Adicionar inicializacao client-side do pixel do criador quando um fa visita o perfil. Isso fara o Pixel Helper mostrar os 2 pixels.

### Mudancas

**1. Criar `src/hooks/useCreatorPixel.ts`**
- Hook que recebe o `pixel_id` do criador
- Usa `useEffect` para chamar `fbq('init', pixelId)` e `fbq('track', 'PageView')` quando o pixel_id estiver disponivel
- Limpa o pixel do criador ao sair da pagina (para nao acumular pixels de criadores diferentes)

**2. Atualizar `src/pages/CreatorProfile.tsx`**
- Importar e chamar `useCreatorPixel(creatorPixelId)` passando o pixel_id extraido do `social_links`
- Isso garante que ao visitar o perfil, o pixel do criador e inicializado no browser

### Detalhes tecnicos

O `fbq` ja esta carregado globalmente pelo script no `index.html`. O hook vai:

```typescript
// src/hooks/useCreatorPixel.ts
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function useCreatorPixel(pixelId: string | undefined) {
  useEffect(() => {
    if (!pixelId || !window.fbq) return;
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }, [pixelId]);
}
```

E no `CreatorProfile.tsx`, adicionar apos extrair o `creatorPixelId`:

```typescript
useCreatorPixel(creatorPixelId);
```

Isso fara com que o Meta Pixel Helper detecte ambos os pixels (plataforma + criador) quando alguem visitar um perfil de criador.

