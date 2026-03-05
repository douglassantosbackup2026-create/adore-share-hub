

## Corrigir pixel do criador no Meta Pixel Helper

### Problema identificado

O hook `useCreatorPixel` esta implementado corretamente, mas ha dois problemas potenciais:

1. **O hook so roda na pagina de perfil do criador** (`/creator/:id`). Se voce esta testando na pagina inicial (`/`), o pixel do criador nao sera inicializado.

2. **O `fbq('track', 'PageView')` generico pode nao estar associando corretamente ao pixel do criador**. O Meta Pixel Helper pode nao reconhecer o segundo pixel se ele for inicializado depois do carregamento da pagina sem um disparo especifico via `trackSingle`.

### Solucao

Atualizar o hook `useCreatorPixel` para:

- Usar `fbq('trackSingle', pixelId, 'PageView')` em vez de `fbq('track', 'PageView')` -- isso garante que o PageView seja disparado especificamente para o pixel do criador, forcando o Pixel Helper a reconhece-lo.
- Adicionar um `console.log` temporario para depuracao, confirmando que o pixel esta sendo inicializado.

### Mudancas

**1. `src/hooks/useCreatorPixel.ts`**

Atualizar o hook para usar `trackSingle`:

```typescript
export function useCreatorPixel(pixelId: string | undefined) {
  useEffect(() => {
    if (!pixelId || !window.fbq) return;
    window.fbq("init", pixelId);
    window.fbq("trackSingle", pixelId, "PageView");
  }, [pixelId]);
}
```

### Como testar

1. Acesse o perfil de um criador que tenha o pixel configurado (ex: Ana Julia - Bahia)
2. O Meta Pixel Helper deve mostrar 2 pixels: o da plataforma (1688353905856977) e o do criador (4384406811885630)
3. Ambos devem mostrar o evento PageView

