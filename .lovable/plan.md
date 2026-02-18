
# Adicionar Meta Pixel em Todas as Páginas

## Abordagem

Como a plataforma é uma Single Page Application (SPA) com React, basta adicionar o código do Meta Pixel **uma única vez** no arquivo `index.html`, dentro do `<head>`. Isso garante que o pixel seja carregado em todas as páginas automaticamente, sem duplicação.

---

## O que será feito

### Arquivo: `index.html`

Inserir o script do Meta Pixel (ID: `4384406811885630`) dentro da tag `<head>`, logo antes do fechamento `</head>`:

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '4384406811885630');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=4384406811885630&ev=PageView&noscript=1"
  />
</noscript>
<!-- End Meta Pixel Code -->
```

---

## Por que só um arquivo?

Em SPAs (React + Vite), o `index.html` é o único arquivo HTML carregado pelo navegador. Toda navegação entre páginas (`/`, `/discover`, `/feed`, etc.) acontece via JavaScript, sem recarregar o HTML. O pixel, ao ser incluído no `<head>`, é inicializado uma vez e rastreia `PageView` no carregamento inicial.

> Se no futuro quiser rastrear eventos específicos por rota (ex: `ViewContent` ao visitar um perfil de criador), basta adicionar chamadas `fbq('track', ...)` nos componentes React relevantes.

---

## Resumo

| Arquivo | Alteração |
|---|---|
| `index.html` | Inserir Meta Pixel no `<head>` |
