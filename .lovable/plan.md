
# Diagnóstico e Correção

## O que foi encontrado

### Problema 1 — Planos com R$ 0,00
A tabela `creator_plans` está **vazia** para a Ana Julia. Os planos que aparecem na tela com R$ 0,00 são os valores padrão calculados pelo frontend (não vêm do banco). O botão "Salvar" na aba de Planos em `/settings` precisa ser clicado para persistir os valores.

Porém, existe um bug no código que impede a gravação: a função `handleSavePlans` faz um `upsert` com `onConflict: "creator_id,plan_name"`, mas para isso funcionar precisa existir uma **unique constraint** na tabela `creator_plans`. Se essa constraint não existir, o upsert falha silenciosamente.

### Problema 2 — "Meus Posts" não aparece na página atual
A seção com edição/exclusão de posts foi criada em `/profile/:id` (FanProfile). Mas o usuário está em `/creator/:id` — que é a **página pública** do criador. São rotas completamente diferentes.

Quando o criador acessa seu próprio perfil público (`/creator/:id`), não há nenhuma indicação de que existe uma área de gestão, nem botão de atalho.

---

## O que será feito

### 1. Corrigir o salvamento dos planos (Settings)
Adicionar uma migração SQL que garante a unique constraint em `creator_plans(creator_id, plan_name)`, para que o upsert funcione corretamente.

Também corrigir o carregamento dos planos existentes no Settings — o mapeamento atual usa `plan_name.toLowerCase()` para identificar "fã", mas o banco guarda "Fã" com acento. Será ajustado para comparar de forma robusta (usando `includes` ou `trim`).

### 2. Adicionar painel de gestão na página `/creator/:id` para o próprio criador

Quando o usuário logado é o dono do perfil (`user.id === id`), mostrar na página `/creator/:id`:

- Um **botão "Gerenciar perfil"** no header (ao lado do avatar), que leva ao `/settings`
- Uma **seção "Meus Posts"** abaixo dos posts públicos, com a mesma grade 3 colunas + hover com botões de Editar e Excluir (igual ao que foi implementado no FanProfile)
- Modal de edição de legenda e nível de acesso
- Modal de confirmação de exclusão

Isso unifica a gestão na página que o criador já usa naturalmente.

---

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `supabase/migrations/` | Adicionar unique constraint em `creator_plans(creator_id, plan_name)` |
| `src/pages/Settings.tsx` | Corrigir mapeamento dos planos existentes (comparação sem acento) |
| `src/pages/CreatorProfile.tsx` | Adicionar seção "Meus Posts" visível apenas ao dono, com editar/excluir |

---

## Fluxo após a correção

```
Criador acessa /creator/:seu-id
       ↓
Vê botão "Gerenciar perfil" → leva ao /settings
       ↓
Abaixo dos posts públicos, aparece seção "Meus Posts" (só para ele)
       ↓
Hover em qualquer post → botões Editar / Excluir
       ↓
Edita legenda ou nível de acesso → salva direto no banco
       ↓
Ao ir em /settings → aba Planos → coloca os preços → clica Salvar
       ↓
Planos salvos no banco → aparecem corretamente na página pública
```
