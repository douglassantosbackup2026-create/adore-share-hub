

## Destacar o plano Super Fan com borda rosa

O plano "Super Fã" (marcado como `popular: true`) já exibe o badge "Mais popular", mas visualmente o card não se diferencia dos demais. A ideia é adicionar uma borda rosa permanente (gradiente primary) nesse card, como mostrado na imagem de referência.

---

## Alteracao

**Arquivo:** `src/pages/CreatorProfile.tsx` (linhas ~430-434)

Na classe do `div` do card de plano, adicionar uma condicao para que, quando `plan.popular` for `true`, o card tenha uma borda rosa/primary permanente, independente de estar selecionado ou nao.

Logica atual:
- Selecionado: `border-primary/60 bg-primary/5 shadow-glow`
- Nao selecionado: `border-border/50 bg-gradient-card hover:border-primary/30`

Nova logica:
- Popular (sempre): `border-primary/60 ring-1 ring-primary/30`
- Popular + selecionado: adiciona `bg-primary/5 shadow-glow`
- Nao popular: mantem o comportamento atual

Isso garante que o card do Super Fan sempre tenha a borda rosa destacada, como na referencia.
