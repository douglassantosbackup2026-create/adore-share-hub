
# Exibir criadores reais na homepage

## Problema identificado

O hook `useCreators` aplica o filtro `.filter((p) => (postsMap.get(p.id) ?? 0) > 0)` antes de retornar os criadores. Isso é correto para o `/discover` (não faz sentido mostrar criador sem posts no grid de descoberta), mas na homepage o resultado é `[]` porque os criadores cadastrados ainda não têm posts, causando o fallback para os 8 mocks.

A homepage (`Index.tsx`) usa exatamente esse hook e só mostra dados reais se `realCreators?.length > 0`.

## O que precisa mudar

### 1. Novo hook: `src/hooks/useFeaturedCreators.ts`

Criar um hook separado e mais simples para a homepage, que:
- Busca todos os perfis com `role = 'creator'`
- Busca os planos de assinatura (para o preço)
- Busca a contagem de assinantes
- **Nao filtra por número de posts** — mostra qualquer criador cadastrado
- Limita a 4 resultados, ordenados por número de assinantes

Manter o `useCreators` intacto porque a lógica de filtrar por posts é correta para o `/discover`.

### 2. Atualizar `src/pages/Index.tsx`

- Substituir `useCreators` por `useFeaturedCreators`
- Remover a importação de `mockCreators`
- A seção "Criadores populares" só aparece se houver dados reais (`featured.length > 0`). Se não houver nenhum criador cadastrado, ocultar a seção inteira com elegância — sem mostrar mock

### Comportamento final

| Situação | Homepage |
|---|---|
| Sem criadores no banco | Seção "Criadores populares" oculta |
| 1-4 criadores sem posts | Exibe os criadores reais disponíveis |
| 4+ criadores | Exibe os 4 mais populares (mais assinantes) |

## Arquivos alterados

- **Novo**: `src/hooks/useFeaturedCreators.ts`
- **Atualizado**: `src/pages/Index.tsx` (troca de hook + remoção do fallback mock)
