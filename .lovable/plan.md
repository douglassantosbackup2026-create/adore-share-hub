
# Aprovação de Criadores pelo Admin

## Diagnóstico

Hoje, qualquer pessoa que se cadastra como criador recebe imediatamente `role = 'creator'` e acesso total ao dashboard. O objetivo é intercalar uma etapa de aprovação: o criador fica em estado "pendente" até que um admin aprove manualmente.

**Restrição importante**: usuários já cadastrados não são afetados — o sistema de aprovação se aplica somente a novos cadastros.

---

## Arquitetura da solução

### Campo novo: `approved` na tabela `profiles`

Será adicionado um campo booleano `approved` com valor padrão `true` para não afetar ninguém já cadastrado. Novos criadores receberão `approved = false` ao se registrar.

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;
```

O trigger `handle_new_user` (que já existe no banco) será atualizado para inserir `approved = false` quando `role = 'creator'`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, handle, category, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'fan'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'handle',
    NEW.raw_user_meta_data->>'category',
    -- Novos criadores ficam pendentes; fãs são aprovados automaticamente
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'fan') = 'creator' THEN false ELSE true END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
```

> Usuários já existentes **não são alterados** — o `DEFAULT true` garante isso.

---

## O que muda em cada camada

### 1. Banco de dados (migração SQL)
- Adicionar coluna `approved boolean NOT NULL DEFAULT true` em `profiles`
- Atualizar função `handle_new_user` para definir `approved = false` quando `role = 'creator'`
- Criar trigger na tabela `auth.users` que aciona `handle_new_user` (caso ainda não exista — verificar)

### 2. `src/components/CreatorRoute.tsx`
Bloquear o acesso ao dashboard se o criador não estiver aprovado, redirecionando para uma página de aguardo:

```
profile.role === 'creator' AND profile.approved === false → /pending-approval
```

### 3. Nova página: `src/pages/PendingApproval.tsx`
Tela simples informando ao criador que seu cadastro está aguardando aprovação do admin, com um botão para voltar ao início.

### 4. `src/App.tsx`
Adicionar a rota `/pending-approval` (pública, sem guard).

### 5. `src/pages/Admin.tsx` — aba "Criadores"
Adicionar sub-seção "Criadores Pendentes" na aba de criadores existente, com:
- Lista de criadores com `approved = false`
- Botão "Aprovar" que faz `UPDATE profiles SET approved = true WHERE id = ?`
- Badge de status (pendente / aprovado) na tabela principal

### 6. `src/hooks/useAdminCreators.ts`
Adicionar hook auxiliar `useAdminPendingCreators` para buscar `profiles WHERE role = 'creator' AND approved = false`.

### 7. `src/contexts/AuthContext.tsx`
A interface `Profile` já inclui todos os campos de `profiles` via `select("*")` — ao adicionar a coluna `approved` ao banco, ela fica disponível automaticamente sem mudança de código. Apenas adicionar `approved: boolean` à interface `Profile`.

---

## Fluxo completo pós-implementação

```text
Signup como creator
      ↓
profiles.approved = false
      ↓
Login → CreatorRoute detecta approved = false
      ↓
Redireciona para /pending-approval
      ↓
Admin acessa /admin → aba "Criadores" → seção "Pendentes"
      ↓
Admin clica "Aprovar"
      ↓
profiles.approved = true
      ↓
Criador faz login → acessa /dashboard normalmente
```

---

## Sequência de implementação

```text
1. Migração SQL: ADD COLUMN approved + atualizar handle_new_user
2. Atualizar interface Profile em AuthContext.tsx
3. Criar src/pages/PendingApproval.tsx
4. Atualizar src/components/CreatorRoute.tsx (checar approved)
5. Atualizar src/App.tsx (adicionar rota /pending-approval)
6. Criar hook useAdminPendingCreators em useAdminCreators.ts
7. Atualizar src/pages/Admin.tsx (adicionar seção de aprovação na aba Criadores)
```

---

## O que NÃO muda
- Usuários já cadastrados continuam com `approved = true` (valor padrão da nova coluna)
- Fãs continuam sem nenhuma restrição
- Todo o restante do fluxo (posts, subscriptions, mensagens) permanece intacto
