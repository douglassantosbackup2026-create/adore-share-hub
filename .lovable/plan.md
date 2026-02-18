
# Pop-up de Verificação de Idade na página /discover

## Objetivo

Exibir um modal bloqueante na primeira visita à página `/discover` perguntando se o usuário tem 18 anos ou mais. Quem confirmar acessa normalmente; quem negar é redirecionado para a página inicial. A resposta fica salva no `localStorage` para não exibir o pop-up a cada visita.

---

## Comportamento detalhado

### Primeira visita (sem resposta salva)
- A página carrega normalmente por baixo (Navbar + grid de criadores)
- Um overlay escuro com fundo desfocado (`backdrop-blur`) cobre todo o conteúdo
- O modal aparece centralizado, não pode ser fechado clicando fora nem pressionando ESC
- Dois botões:
  - **"Sim, tenho 18 anos ou mais"** → fecha o modal, salva `age_verified = "true"` no `localStorage`, página fica acessível
  - **"Não, sou menor de idade"** → redireciona para `/` (página inicial)

### Visitas seguintes
- Se `localStorage.getItem("age_verified") === "true"` → modal não aparece

### Usuários já logados
- O modal ainda aparece na primeira visita mesmo estando logado, pois a verificação de idade é independente da autenticação

---

## O que muda

### Novo componente: `src/components/AgeGateModal.tsx`

Um modal construído com os primitivos `Dialog` do Radix (já instalado no projeto) com:
- Overlay com `backdrop-blur-md` sobre o conteúdo da página
- Ícone de escudo ou cadeado (lucide-react)
- Título: **"Verificação de idade"**
- Subtítulo: **"Este site contém conteúdo adulto. Você confirma que tem 18 anos ou mais?"**
- Aviso legal pequeno abaixo dos botões
- Botão primário (gradient-primary): "Sim, tenho 18 anos ou mais"
- Botão outline vermelho/destructive: "Não, sou menor de idade"
- `preventClose` — desabilita o fechamento pelo `X`, clique fora e ESC

### Atualização: `src/pages/Discover.tsx`

- Importar o `AgeGateModal`
- Adicionar estado `showAgeGate` inicializado com:
  ```ts
  useState(() => localStorage.getItem("age_verified") !== "true")
  ```
- Renderizar `<AgeGateModal open={showAgeGate} onConfirm={...} onDeny={...} />`
- `onConfirm`: salva no localStorage e fecha o modal
- `onDeny`: redireciona para `/` via `useNavigate`

---

## Nenhuma alteração no banco de dados

A verificação de idade é puramente client-side via `localStorage`. Não há necessidade de salvar no banco pois:
- É uma proteção legal básica (honesty-based), não um controle de acesso técnico
- O controle de acesso real ao conteúdo já está feito via RLS no banco

---

## Sequência de execução

```text
1. Criar src/components/AgeGateModal.tsx
2. Atualizar src/pages/Discover.tsx (importar e renderizar o modal)
```

## Arquivos alterados

- **Novo**: `src/components/AgeGateModal.tsx`
- **Atualizado**: `src/pages/Discover.tsx`
