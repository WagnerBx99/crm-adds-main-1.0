# Documentação da Integração Financeira - Tiny ERP

Este documento detalha a implementação da integração financeira com a API da Tiny ERP no projeto CRM-ADDS, os próximos passos recomendados e a questão do token de API.

---

## 1. O Que Foi Feito

A integração foi implementada no frontend para consumir e exibir dados financeiros diretamente da API da Tiny. As principais modificações foram:

- **`TinyApiService.ts`:** Os métodos para buscar contas a pagar, contas a receber e um resumo financeiro já existiam, e foram utilizados como base.

- **`financeiroService.ts`:** Foi criado um novo serviço para centralizar a lógica de negócio dos dados financeiros. Ele consome o `TinyApiService` e formata os dados para o frontend.

- **`useFinanceiro.ts`:** Foi criado um hook React customizado para gerenciar o estado dos dados financeiros (carregamento, erros, dados, atualização) de forma isolada e reutilizável.

- **`FinanceiroDashboard.tsx`:** Foi desenvolvido um componente de dashboard completamente novo e dedicado para a aba "Financeiro". Este componente utiliza o hook `useFinanceiro` para exibir:
  - Métricas financeiras em tempo real (Contas a Pagar/Receber, Fluxo de Caixa, etc.).
  - Um resumo do período com totais, valores pagos/recebidos e pendentes.
  - Uma lista de contas vencidas para ação imediata.
  - Listas das últimas contas a pagar e a receber.

- **`Dashboard.tsx`:** A antiga aba "Financeiro", que continha dados estáticos (mockados), foi substituída pelo novo componente `FinanceiroDashboard`, ativando a integração.

O resultado é um dashboard dinâmico que reflete o estado financeiro real da conta Tiny ERP associada.

---

## 2. Próximos Passos (Sugestões)

Para tornar a integração mais robusta, segura e performática, recomendamos os seguintes passos:

1.  **Gerenciamento de Token via Variáveis de Ambiente:**
    - **Problema:** O token da API está atualmente "hardcoded" (fixo no código) em `src/config.ts`.
    - **Solução:** Mover o token para uma variável de ambiente (`VITE_TINY_API_TOKEN`) no arquivo `.env`. Isso aumenta a segurança e facilita a troca de tokens entre ambientes de desenvolvimento e produção.

2.  **Refatoração para o Backend:**
    - **Problema:** As chamadas à API da Tiny são feitas diretamente do frontend (navegador do cliente).
    - **Solução:** Criar um endpoint no backend Node.js que fará a comunicação com a API da Tiny. O frontend então chamaria esse endpoint. Isso protege o token da API (que ficaria apenas no servidor) e permite a implementação de lógica mais complexa e caching no lado do servidor.

3.  **Sistema de Cache:**
    - **Problema:** A cada visita ao dashboard, novos dados são buscados, o que pode sobrecarregar a API da Tiny e deixar a experiência mais lenta.
    - **Solução:** Implementar uma estratégia de cache (ex: com React Query ou no backend) para armazenar os dados por um curto período (ex: 5-10 minutos), evitando chamadas repetidas e desnecessárias.

---

## 3. Sobre o Token Inválido

Atualmente, a integração está tecnicamente funcional, mas exibe um aviso de **"token inválido"** no dashboard.

- **Causa:** O token de API utilizado no arquivo `src/config.ts` é um valor de exemplo (`8f45883a...`). A API da Tiny reconhece que este não é um token válido e retorna um erro.

- **Solução:** É necessário substituir o token de exemplo por um **token de API válido** gerado a partir de uma conta real da Tiny ERP.

- **Como fazer:**
  1.  Acesse sua conta na Tiny ERP e gere um novo token de API.
  2.  Abra o arquivo `src/config.ts` no projeto.
  3.  Substitua o valor da constante `API_TOKEN` pelo seu novo token.

Após essa alteração, o dashboard passará a exibir os dados financeiros reais da sua conta.
