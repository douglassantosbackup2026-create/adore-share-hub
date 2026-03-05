

## Mostrar posts gratuitos para visitantes antes de pedir cadastro

### Situação atual
Na página do criador (`CreatorProfile.tsx`, linhas 426-452), quando o visitante não está logado, **todo** o conteúdo é escondido com um overlay de blur + placeholder cinza e um CTA "Cadastrar agora". Nenhuma foto/vídeo real é exibida.

### Plano

Alterar a lógica para que visitantes não logados vejam os **posts gratuitos** (`min_plan === "free"`) normalmente, e o overlay de cadastro apareça somente **após os primeiros posts visíveis** (como um "muro" parcial).

**Mudanças em `src/pages/CreatorProfile.tsx`:**

1. **Remover o bloqueio total para `!user`** -- em vez de mostrar o overlay sobre placeholders, renderizar os posts gratuitos normalmente (como já faz para usuários logados).

2. **Separar posts em duas listas**: posts gratuitos (visíveis) e posts pagos (bloqueados). Para visitantes, mostrar os gratuitos com imagem real + os primeiros 2-3 pagos como locked (blur), e depois inserir um **banner de cadastro inline** no grid.

3. **Banner de cadastro inline**: Após os posts gratuitos + alguns locked, renderizar um card que ocupa a largura toda com o CTA "Crie sua conta para ver mais conteúdo" + botão de cadastro. Posts restantes ficam ocultos.

4. **Manter a proteção para posts pagos**: Posts com `min_plan !== "free"` continuam com o visual de lock (blur + ícone de cadeado), mas ao clicar, redirecionam para `/signup` em vez de abrir o modal de pagamento.

### Resultado esperado

- Visitante entra no perfil → vê as fotos/vídeos gratuitos normalmente
- Após os conteúdos gratuitos, vê 2-3 posts com blur (locked) como "teaser"
- Um banner inline convida ao cadastro
- Clique em post locked → redireciona para signup

