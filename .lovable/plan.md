
# Corrigir: informações não salvas/exibidas em /settings

## Causa raiz

Dois problemas encadeados foram identificados:

**Problema 1 — Trigger ausente**: A função `handle_new_user` existe no banco, mas o trigger que a chama (`on_auth_user_created`) nunca foi criado. Toda vez que um usuário se cadastra, o perfil na tabela `profiles` não é gerado automaticamente. A tabela `profiles` está completamente vazia.

**Problema 2 — Consequência**: Sem perfil, o `AuthContext` retorna `profile = null`. A página Settings tenta carregar os dados de `authProfile` mas recebe nulo — os campos ficam em branco e salvar não funciona porque não há linha para fazer UPDATE.

## O que será corrigido

### 1. Criar o trigger no banco de dados (migration)
Criar o trigger `on_auth_user_created` que chama `handle_new_user()` a cada novo usuário criado em `auth.users`. Isso garante que todo cadastro futuro gere um perfil automaticamente.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Criar perfis para usuários existentes (migration)
Para os usuários já cadastrados que não têm perfil, criar registros na tabela `profiles` com base nos metadados armazenados no sistema de autenticação:

```sql
INSERT INTO public.profiles (id, role, name, handle, category)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'role', 'fan'),
  COALESCE(au.raw_user_meta_data->>'name', ''),
  au.raw_user_meta_data->>'handle',
  au.raw_user_meta_data->>'category'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### 3. Ajuste na página Settings — fallback de upsert
Alterar `handleSaveProfile` para usar `upsert` em vez de `update`. Isso garante que, mesmo que um perfil ainda não exista por algum motivo, ele seja criado na primeira vez que o usuário salvar as configurações (proteção extra).

```typescript
// Antes: .update({...}).eq("id", user.id)
// Depois: .upsert({ id: user.id, ...campos })
```

### 4. Ajuste no AuthContext — recarregar perfil após atualização
Após o `handleSaveProfile`, forçar um novo fetch do perfil para que a Navbar e outros componentes que consomem `useAuth()` reflitam imediatamente as mudanças salvas.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migration SQL | Criar trigger + inserir perfis para usuários existentes |
| `src/pages/Settings.tsx` | Mudar `update` → `upsert` no handleSaveProfile |
| `src/contexts/AuthContext.tsx` | Expor função `refreshProfile` para forçar recarga pós-save |

## Resultado esperado

- Novos cadastros criam perfil automaticamente
- Usuários existentes que não tinham perfil recebem um perfil gerado a partir dos metadados do cadastro
- A página Settings exibe os dados corretamente ao carregar
- Salvar funciona para todos os usuários, novos ou antigos
