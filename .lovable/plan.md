
# Flare — Todas as Páginas da Plataforma

## Situação atual
Já existem 3 páginas: `Index` (landing), `Discover` (busca de criadores) e `CreatorProfile` (perfil + planos). O objetivo é construir todas as páginas essenciais de uma plataforma estilo OnlyFans/Privacy.

---

## Páginas a criar

### 1. `/login` — Login
Tela de autenticação com:
- Campo de e-mail e senha
- Botão "Entrar com Google" (visual only)
- Link para cadastro
- Layout com gradiente e logo Flare centralizada

### 2. `/signup` — Cadastro
Duas abas: **Fã** e **Criador**
- Formulário: nome, e-mail, senha, confirmação
- Para criadores: campo de categoria e handle
- CTA: "Criar conta"

### 3. `/feed` — Feed do usuário logado
Simula o feed de conteúdo exclusivo pós-assinatura:
- Stories horizontais (avatars dos criadores seguidos)
- Posts com imagem/vídeo bloqueados ou desbloqueados
- Sidebar com sugestões de criadores

### 4. `/messages` — Mensagens diretas
- Lista de conversas à esquerda
- Painel de chat à direita
- Balões de mensagem, input e botão de envio
- Badge de mensagem não lida

### 5. `/dashboard` — Dashboard do criador
- Cards de resumo: receita mensal, assinantes, posts, avaliação
- Gráfico de receita (usando Recharts já instalado)
- Lista dos últimos assinantes
- Seção de upload de novo conteúdo

### 6. `/settings` — Configurações
Tabs navegáveis:
- **Perfil**: foto, nome, bio, redes sociais
- **Planos**: edição de preços dos 3 planos (Fã, Super Fã, VIP)
- **Pagamentos**: dados bancários e histórico de saques
- **Segurança**: trocar senha, autenticação em dois fatores

---

## Mudanças em arquivos existentes

### `src/App.tsx`
Adicionar as novas rotas:
```
/login, /signup, /feed, /messages, /dashboard, /settings
```

### `src/components/Navbar.tsx`
- Botão "Entrar" passa a linkar para `/login`
- Adicionar itens de navegação para usuário logado: Feed, Mensagens, Dashboard

---

## Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/pages/Login.tsx` | Tela de login |
| `src/pages/Signup.tsx` | Tela de cadastro (fã ou criador) |
| `src/pages/Feed.tsx` | Feed pós-assinatura com posts e stories |
| `src/pages/Messages.tsx` | Chat de mensagens diretas |
| `src/pages/Dashboard.tsx` | Painel do criador com analytics |
| `src/pages/Settings.tsx` | Configurações da conta |

---

## Detalhes técnicos
- **Estado simulado**: todas as páginas usarão dados mock locais (sem backend por enquanto), seguindo o mesmo padrão de `creators.ts`
- **Recharts** (já instalado): usado no Dashboard para o gráfico de receita mensal
- **Design system**: todas as páginas seguirão exatamente o mesmo sistema de cores, gradientes e componentes já definidos em `index.css` e `tailwind.config.ts` — dark theme, rose/pink gradients, glassmorphism
- **Navbar atualizada**: adiciona links condicionais simulando estado logado (via `useState` local)
- Nenhuma nova dependência será instalada — tudo usando o que já existe no projeto
