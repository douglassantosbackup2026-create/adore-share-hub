
## Modelo de comissao de 20% da plataforma

Implementar uma taxa de 20% sobre cada assinatura, onde o criador recebe 80% e a plataforma retém 20%. A taxa sera aplicada em todos os pontos que calculam/exibem receita.

---

### Constante global

Criar um arquivo `src/lib/constants.ts` com:

```
PLATFORM_FEE_RATE = 0.20
```

Isso centraliza o percentual em um unico lugar, facilitando ajustes futuros.

---

### Alteracoes no frontend

**1. Dashboard do Criador (`src/hooks/useDashboardStats.ts`)**

No calculo de `revenue` (linha 30-32), multiplicar o total por `(1 - PLATFORM_FEE_RATE)` para que o criador veja apenas o valor liquido (80%):

```
revenue = totalBruto * 0.80
```

**2. Dashboard do Criador (`src/pages/Dashboard.tsx`)**

Atualizar o label do card de receita (linha 62) de "Receita Mensal" para "Receita Liquida" e adicionar uma nota explicativa pequena indicando "apos taxa de 20%".

**3. Grafico de receita mensal (`src/hooks/useMonthlyRevenue.ts`)**

A funcao SQL `get_creator_monthly_revenue` calcula receita bruta. Duas opcoes:
- Opcao A (mais simples): aplicar o fator 0.80 no frontend apos receber os dados
- Opcao B: alterar a funcao SQL

Usaremos a Opcao A para evitar migracao SQL — multiplicar cada `value` por 0.80 no hook.

**4. Painel Admin — Financeiro (`src/pages/Admin.tsx`)**

No painel financeiro do admin, exibir AMBOS os valores:
- **Receita Total Bruta** (valor que os fans pagam)
- **Comissao da Plataforma (20%)** (novo card)
- **Repasse aos Criadores (80%)**

Na tabela "Top 10 Criadores", a coluna "Receita Est." continuara mostrando o valor bruto, mas adicionaremos uma coluna "Comissao" com o valor de 20%.

**5. Funcao SQL `get_admin_creator_stats`**

Nao precisa alterar — o admin vera o bruto e o calculo de 20% sera feito no frontend.

**6. Funcao SQL `get_platform_stats`**

Mesma logica — manter bruto no banco e calcular no frontend.

---

### Pagina de Settings do Criador

Na aba "Pagamentos" (`src/pages/Settings.tsx`), adicionar um aviso informativo:

> "A plataforma retém 20% de cada assinatura como taxa de servico. Voce recebe 80% do valor dos seus planos."

---

### Resumo das alteracoes

| Arquivo | O que muda |
|---|---|
| `src/lib/constants.ts` (novo) | Constante `PLATFORM_FEE_RATE = 0.20` |
| `src/hooks/useDashboardStats.ts` | Receita multiplicada por 0.80 |
| `src/hooks/useMonthlyRevenue.ts` | Valores do grafico multiplicados por 0.80 |
| `src/pages/Dashboard.tsx` | Label "Receita Liquida" + nota da taxa |
| `src/pages/Admin.tsx` | Cards separados: bruto, comissao 20%, repasse 80% |
| `src/pages/Settings.tsx` | Aviso sobre taxa de 20% na aba Pagamentos |

Nenhuma alteracao de banco de dados e necessaria. A taxa e aplicada puramente na camada de exibicao, o que permite ajustar o percentual facilmente no futuro.
