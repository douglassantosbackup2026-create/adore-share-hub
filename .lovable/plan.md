
# Remover usuário anajulia_858d

## Identificação do usuário

| Campo | Valor |
|---|---|
| Nome | Ana Julia |
| Handle | anajulia_858d |
| ID | 858d1fb6-2743-473b-98c0-18340a13896b |
| Role | creator |
| Posts | 0 |
| Seguidores | 0 |
| Assinaturas | 0 |
| Mensagens | 0 |

O perfil não possui nenhum dado associado, tornando a remoção segura e sem risco de perda de conteúdo.

Existe um segundo usuário chamado "Ana Julia" (handle: `anajulia_8a86`) que NÃO será afetado.

---

## O que será removido

1. Registro na tabela `profiles` (ID: `858d1fb6-2743-473b-98c0-18340a13896b`)
2. Registro na tabela `user_roles` (role padrão `user` criada no signup)

A conta de autenticação (login/senha) só pode ser removida via função de banco de dados com privilégios elevados (`admin_ban_user`), que já está disponível no projeto e exclui o perfil do usuário.

---

## Abordagem técnica

Usar a função RPC `admin_ban_user` que já existe no banco de dados:

```sql
SELECT admin_ban_user('858d1fb6-2743-473b-98c0-18340a13896b');
```

Esta função:
- Verifica que quem chama tem role `admin`
- Deleta o registro de `profiles` correspondente

Após isso, também remover o registro de `user_roles`:
```sql
DELETE FROM user_roles WHERE user_id = '858d1fb6-2743-473b-98c0-18340a13896b';
```

---

## Sequência de execução

```text
1. Executar admin_ban_user via SQL para deletar o profile
2. Deletar registro de user_roles
```

Isso removerá completamente o usuário `anajulia_858d` do sistema sem afetar nenhum outro usuário.
