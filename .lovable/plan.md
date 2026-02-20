

## Corrigir redirecionamento para onboarding apos login

### Problema

No `AuthContext.tsx`, quando o usuario faz login:
1. `setUser(session.user)` e chamado
2. `fetchProfile(session.user.id)` e chamado (async, nao aguardado)
3. `setLoading(false)` e chamado imediatamente

Como `fetchProfile` ainda nao terminou, `profile` continua `null`. O `Login.tsx` ve `user` definido + `profile === null` + `loading === false` e redireciona para `/onboarding`.

### Solucao

Alterar o `AuthContext.tsx` para que `loading` so se torne `false` **depois** que o perfil for carregado:

1. No handler `onAuthStateChange`: mover `setLoading(false)` para **dentro** de `fetchProfile` (apos o perfil ser definido), ou aguardar o `fetchProfile` antes de setar loading.

2. No `getSession().then(...)`: aguardar `fetchProfile` com `await` antes de chamar `setLoading(false)`.

3. Remover o `setTimeout` do `fetchProfile` no `onAuthStateChange` -- ele causa uma race condition onde o loading termina antes do perfil carregar.

### Detalhes tecnicos

**Arquivo: `src/contexts/AuthContext.tsx`**

Mudancas no `useEffect`:

```text
// onAuthStateChange handler:
// ANTES:
setTimeout(() => fetchProfile(session.user.id), 0);
setLoading(false);

// DEPOIS:
fetchProfile(session.user.id).then(() => setLoading(false));
// Remover o setLoading(false) solto

// getSession handler:
// ANTES:
fetchProfile(session.user.id);  // nao aguardado
setLoading(false);

// DEPOIS:
await fetchProfile(session.user.id);
setLoading(false);
```

Tambem garantir que quando nao ha sessao, `setLoading(false)` continue sendo chamado normalmente.

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/contexts/AuthContext.tsx` | Aguardar fetchProfile antes de setar loading = false |
