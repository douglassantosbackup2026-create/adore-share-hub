
# Promover douglapinheirosantos@gmail.com a Administrador

## Situação encontrada

O usuário foi localizado com sucesso no sistema de autenticação:

- **E-mail:** douglapinheirosantos@gmail.com
- **ID:** `8794c320-3d9d-41f1-a9a4-a8b7d188c3f3`
- **Perfil na plataforma:** ainda não criado (o usuário provavelmente ainda não completou o cadastro/onboarding)
- **Roles atuais:** nenhum registro em `user_roles`

## O que será feito

Uma única inserção na tabela `user_roles` para conceder o papel de administrador:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('8794c320-3d9d-41f1-a9a4-a8b7d188c3f3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Comportamento esperado após a mudança

- Quando esse usuário fizer login e acessar `/admin`, o `AdminRoute` vai chamar `has_role` → encontrará o registro `admin` → liberará o painel completo
- Mesmo que o perfil ainda não exista (sem nome/handle), o acesso ao painel de admin funcionará normalmente, pois a verificação é feita apenas na tabela `user_roles`
- Se o usuário ainda não completou o cadastro, ele poderá usar a conta normalmente e terá acesso admin assim que logar

## Arquivos afetados

Nenhum arquivo de código será alterado — apenas um dado inserido no banco de dados.
