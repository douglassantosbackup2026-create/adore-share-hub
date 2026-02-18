
# Remover confirmação por e-mail

## O que será feito

Atualmente, após o cadastro, o usuário vê a mensagem "Verifique seu e-mail para confirmar o cadastro" e é redirecionado para o login sem estar autenticado. Isso cria fricção desnecessária.

A mudança desativa essa exigência e faz o usuário entrar automaticamente logo após criar a conta.

## Alterações necessárias

### 1. Configuração de autenticação (backend)
Ativar o **auto-confirm** no sistema de autenticação — os novos cadastros serão confirmados instantaneamente, sem e-mail.

### 2. `src/contexts/AuthContext.tsx`
Remover o `emailRedirectTo` da chamada de `signUp`, pois não fará mais sentido com auto-confirm ativo.

### 3. `src/pages/Signup.tsx`
Alterar o comportamento após o cadastro:
- **Antes**: exibe toast "Verifique seu e-mail" e redireciona para `/login`
- **Depois**: exibe toast "Conta criada com sucesso!" e redireciona direto para `/feed` (o usuário já está autenticado)

## Resultado esperado

```text
Usuário preenche cadastro
        ↓
Clica em "Criar conta"
        ↓
Conta criada + sessão iniciada automaticamente
        ↓
Redirecionado para /feed ✓
```

Sem e-mails de confirmação, sem etapa extra.
