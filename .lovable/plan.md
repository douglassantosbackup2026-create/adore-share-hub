
# Corrigir loop silencioso no login quando perfil não existe

## Diagnóstico

O login está **funcionando corretamente** (o backend retorna status 200). O problema é uma condição de guarda silenciosa no `Login.tsx`:

```ts
// Só redireciona se AMBOS user E profile existem
if (user && profile) {
  navigate(...)
}
```

O usuário `testefla@teste.com` (ID: `2380bd06-63a3-4650-82d7-76b8f4a9dbb9`) **não tem registro na tabela `profiles`**, então `profile` permanece `null` e o redirecionamento nunca ocorre — mesmo com login bem-sucedido.

Isso pode acontecer com qualquer usuário criado diretamente pelo sistema de auth sem trigger de criação de perfil, ou cujo perfil foi deletado.

---

## Duas correções necessárias

### Correção 1 — `Login.tsx`: Redirecionar com base em `user`, não em `user + profile`

O redirecionamento pós-login não deve depender de `profile` existir. Em vez disso:
- Se `user` existe mas `profile` é `null` → redirecionar para `/onboarding` (usuário precisa completar cadastro)
- Se `user` e `profile` existem → redirecionar normalmente para `/dashboard` ou `/feed`

```ts
// ANTES (bugado):
if (user && profile) { navigate(...) }

// DEPOIS (correto):
if (user) {
  if (profile) {
    navigate(profile.role === "creator" ? "/dashboard" : "/feed", { replace: true });
  } else {
    navigate("/onboarding", { replace: true });
  }
}
```

Também é necessário adicionar o `loading` do auth para evitar redirecionamento prematuro durante a hidratação:
```ts
if (!loading && user) { ... }
```

### Correção 2 — `AuthContext.tsx`: Criar perfil automaticamente se não existir

Quando o `fetchProfile` retorna `null`, criar um perfil básico com os dados do `user.user_metadata` (que já contém `name`, `role`, `handle`, etc., definidos no momento do signup):

```ts
const fetchProfile = async (userId: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (!data) {
    // Perfil não existe — criar com metadados do auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata;
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name: meta.name || "Usuário",
          role: meta.role || "fan",
          handle: meta.handle || null,
          category: meta.category || null,
        })
        .select()
        .single();
      setProfile(newProfile);
    }
  } else {
    setProfile(data);
  }
};
```

---

## Arquivos alterados

### 1. `src/contexts/AuthContext.tsx`
- `fetchProfile`: verificar se `data` é `null` após a query e, se for, inserir um novo perfil com `user_metadata`

### 2. `src/pages/Login.tsx`
- Trocar `if (user && profile)` por `if (!loading && user)`
- Dentro: checar `profile` para decidir rota — se `null`, redirecionar para `/onboarding`

---

## Sequência de execução

```text
1. Atualizar src/contexts/AuthContext.tsx (auto-criar perfil se não existir)
2. Atualizar src/pages/Login.tsx (corrigir lógica de redirecionamento)
```

## Resultado esperado

| Situação | Comportamento |
|---|---|
| Login com perfil existente (creator) | Redireciona para `/dashboard` |
| Login com perfil existente (fan) | Redireciona para `/feed` |
| Login sem perfil (qualquer role) | Cria perfil automaticamente e redireciona para `/onboarding` |
| Login com erro | Exibe toast de erro, permanece na tela |
