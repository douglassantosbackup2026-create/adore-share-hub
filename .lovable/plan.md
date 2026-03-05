

## Age Gate global em todas as paginas

### Plano

Mover o `AgeGateModal` do `Discover.tsx` para o nivel do `App.tsx`, tornando-o global. Assim, qualquer pagina exibira o modal antes de permitir interacao.

### Mudancas

**1. `src/App.tsx`**
- Importar `AgeGateModal` e `useState`
- Adicionar estado `showAgeGate` (lendo `localStorage`)
- Renderizar `<AgeGateModal>` acima do `<Routes>`, dentro do `AuthProvider`
- `onConfirm`: salvar no `localStorage` e fechar
- `onDeny`: redirecionar para uma pagina externa (ex: `google.com`) ja que nao ha pagina "segura" para redirecionar

**2. `src/pages/Discover.tsx`**
- Remover o `AgeGateModal`, o estado `showAgeGate`, e os handlers `handleConfirm`/`handleDeny` -- nao sao mais necessarios aqui pois o gate agora e global

### Resultado
- Visitante acessa qualquer pagina → modal de verificacao de idade aparece
- Apos confirmar, o modal nao aparece novamente (persistido no `localStorage`)
- Se negar, e redirecionado para fora do site

