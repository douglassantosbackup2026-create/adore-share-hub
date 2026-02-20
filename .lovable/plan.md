

## Remover dados mock do historico de saques

### Mudanca

Remover o array estatico `withdrawals` do `Settings.tsx` e mostrar uma mensagem de estado vazio ("Nenhum saque realizado") quando nao houver dados.

### Detalhes tecnicos

**Arquivo: `src/pages/Settings.tsx`**

1. Remover o array `withdrawals` (linhas 15-19) com os dados mock
2. Na secao "Historico de saques", substituir o `.map()` por uma mensagem de estado vazio:
   - Texto centralizado: "Nenhum saque realizado ainda"
   - Estilo sutil com `text-muted-foreground`

No futuro, quando uma tabela `withdrawals` for criada no banco, esse componente pode ser atualizado para buscar dados reais.

