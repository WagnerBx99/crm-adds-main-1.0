# Guia de Testes para o Módulo de Backup

Este documento fornece instruções detalhadas sobre como configurar, executar e verificar os testes automatizados para o módulo de backup e recuperação de dados do CRM Empresarial.

## Pré-requisitos

Antes de executar os testes, verifique se o ambiente está configurado corretamente:

1. **Dependências de Desenvolvimento**
   ```bash
   npm install --save-dev @types/jest jest ts-jest @testing-library/react @testing-library/jest-dom
   ```

2. **Configuração do Jest**
   O arquivo `jest.config.js` na raiz do projeto deve incluir:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     moduleNameMapper: {
       '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/mocks/styleMock.js',
     },
     setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
     testMatch: ['**/*.test.ts', '**/*.test.tsx'],
   };
   ```

3. **Arquivo de configuração de testes**
   Crie ou atualize o arquivo `src/tests/setupTests.ts`:
   ```typescript
   import '@testing-library/jest-dom';
   ```

4. **Banco de Dados de Teste**
   Configure um banco de dados separado para testes:
   ```
   # Arquivo .env.test
   DB_HOST=localhost
   DB_NAME=crm_test_db
   DB_USER=test_user
   DB_PASSWORD=test_password
   ```

## Estrutura de Testes

Os testes para o módulo de backup estão organizados nas seguintes categorias:

### 1. Testes Unitários

Os testes unitários verificam o funcionamento de componentes e serviços isoladamente.

- **Componentes UI**: `src/tests/unit/components/BackupSettings.test.tsx`
- **Serviços de Backup**: `src/tests/unit/services/BackupService.test.ts`

### 2. Testes de Integração

Os testes de integração verificam o fluxo completo de backup e restauração.

- **Fluxo Completo**: `src/tests/integration/backup-restoration-flow.test.ts`

## Execução dos Testes

### Testes Unitários

Para executar os testes unitários:

```bash
npm test -- --testPathPattern=src/tests/unit
```

Para executar testes específicos de um componente:

```bash
npm test -- --testPathPattern=src/tests/unit/components/BackupSettings
```

### Testes de Integração

Os testes de integração exigem um ambiente de teste isolado:

```bash
NODE_ENV=test npm test -- --testPathPattern=src/tests/integration
```

> **Atenção**: Os testes de integração realizam operações reais no banco de dados de teste e sistema de arquivos!

## Métricas e Cobertura

Para gerar relatórios de cobertura de código:

```bash
npm test -- --coverage
```

Os relatórios HTML estarão disponíveis em `coverage/lcov-report/index.html`.

## Testes Manuais e Exploratórios

Além dos testes automatizados, recomenda-se realizar testes manuais para validar a interface e a experiência do usuário:

1. **Teste de Interface**
   - Navegue pelas abas da seção de Backup
   - Verifique se todos os campos estão funcionando corretamente
   - Teste a responsividade em diferentes tamanhos de tela

2. **Teste de Operações**
   - Inicie um backup manual e verifique o progresso
   - Configure um agendamento de backup
   - Restaure um backup existente

## Solução de Problemas

### Erro de Conexão com Banco de Dados

Se os testes de integração falharem com erros de conexão:

1. Verifique se o banco de dados de teste está em execução
2. Confirme as credenciais no arquivo `.env.test`
3. Execute o comando para preparar o banco de teste:
   ```bash
   npm run db:test:prepare
   ```

### Falhas nos Testes de Componentes

Se os testes de componentes React falharem:

1. Verifique se o componente foi atualizado sem atualizar os testes
2. Confirme se os mocks estão configurados corretamente
3. Execute o comando com flag de atualização de snapshots:
   ```bash
   npm test -- -u
   ```

## Melhores Práticas

1. **Manter os Testes Atualizados**: Sempre atualize os testes quando o código for modificado

2. **Execução Regular**: Configure integração contínua para executar testes automaticamente

3. **Isolamento**: Garanta que os testes não interfiram uns nos outros

4. **Dados de Teste**: Use dados de teste consistentes e representativos

5. **Cobertura**: Busque manter cobertura de pelo menos 80% do código

## Próximos Passos

1. **Expansão dos Testes**
   - Adicionar testes de desempenho para grandes volumes de dados
   - Implementar testes de carga para operações concorrentes

2. **Automação**
   - Integrar testes ao pipeline de CI/CD
   - Configurar alertas para falhas de teste

3. **Documentação**
   - Melhorar a documentação dos casos de teste
   - Criar relatórios automatizados de teste 