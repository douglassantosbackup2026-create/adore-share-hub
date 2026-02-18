
# Diagnóstico: Erro já foi corrigido

## O que a imagem mostra
O erro `Unable to parse HTML; parse5 error code disallowed-content-in-noscript-in-head` era causado pela tag `<img>` dentro de `<noscript>` no `<head>` do `index.html`.

## Estado atual do arquivo
O arquivo `index.html` já está **correto**:

```
<head>
  ...scripts e meta tags...
</head>      ← fecha na linha 39, sem noscript

<body>
  <noscript>   ← está aqui, no body (correto)
    <img .../>
  </noscript>
  <div id="root"></div>
</body>
```

A correção já foi aplicada em uma sessão anterior. A imagem enviada mostra o estado antigo antes da correção.

## Próximo passo sugerido
Com o build funcionando, o próximo passo é verificar os eventos Meta de ponta a ponta:
1. A edge function `meta-capi` precisa ser deployada
2. Testar o fluxo de assinatura para confirmar que os eventos `ViewContent`, `InitiateCheckout` e `Purchase` chegam ao Meta Events Manager
