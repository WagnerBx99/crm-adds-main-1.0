# Sistema de Cadastro Público - Documentação Completa

## 📋 Visão Geral

O Sistema de Cadastro Público foi desenvolvido para capturar dados de clientes antes do fluxo de personalização, integrando diretamente com a API do Tiny ERP para criar contatos de forma automatizada.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
src/
├── types/contact.ts                    # Tipos TypeScript para contatos
├── services/contactService.ts          # Serviços de integração com APIs
├── components/
│   ├── contact/
│   │   └── PublicContactForm.tsx      # Formulário principal de cadastro
│   └── public/
│       └── PublicWorkflow.tsx         # Fluxo completo (cadastro + sucesso)
└── pages/
    └── PublicFormPage.tsx             # Página pública dedicada
```

### Fluxo de Dados

1. **Entrada de Dados** → Formulário de cadastro
2. **Validação** → Validações em tempo real (CPF/CNPJ, email, etc.)
3. **Consulta CEP** → Preenchimento automático de endereço
4. **Integração Tiny** → Criação de contato na API
5. **Feedback** → Confirmação de sucesso ao usuário

## 🎯 Funcionalidades Implementadas

### ✅ Formulário de Cadastro

- **Tipos de Pessoa**: Pessoa Física (CPF) ou Jurídica (CNPJ)
- **Validações em Tempo Real**:
  - CPF/CNPJ com algoritmo de validação brasileiro
  - E-mail com regex
  - Telefone com formatação automática
  - CEP com consulta automática

### ✅ Campos Obrigatórios

- Nome/Razão Social
- CPF ou CNPJ
- Telefone/WhatsApp
- E-mail
- Endereço completo (CEP, UF, Cidade, Logradouro, Número, Bairro)

### ✅ Campos Opcionais

- Nome Fantasia (apenas PJ)
- Inscrição Estadual/Municipal
- Complemento do endereço

### ✅ UX/UI Features

- **Responsivo**: Mobile-first com adaptação para desktop
- **Acessibilidade**: Labels, placeholders, foco automático
- **Feedback Visual**: 
  - Ícones de validação (verde/vermelho)
  - Mensagens de erro específicas
  - Loading states durante operações
- **Máscaras de Input**: CPF, CNPJ, telefone, CEP

## 🔧 Configuração Técnica

### Variáveis de Ambiente

```env
VITE_TINY_API_TOKEN=seu_token_aqui
```

### APIs Utilizadas

1. **Tiny ERP API**: `https://api.tiny.com.br/api2/contatos.incluir.php`
2. **ViaCEP**: `https://viacep.com.br/ws/{cep}/json/`

### Exemplo de Payload Tiny

```json
{
  "token": "SEU_TOKEN",
  "formato": "json",
  "nome": "João Silva",
  "tipo_pessoa": "1",
  "cpf_cnpj": "12345678901",
  "fone": "11999999999",
  "email": "joao@email.com",
  "cep": "01234567",
  "endereco": "Rua das Flores",
  "numero": "123",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

## 🌐 Rotas Públicas

### Nova Rota Principal
- `/cadastro` - Formulário de cadastro público

### Rotas Existentes (mantidas)
- `/orcamento` - Orçamento público
- `/personalizar` - Personalização
- `/public/personalize` - Personalização alternativa

## 🧪 Testes Manuais

### Teste de CPF
```
CPF Válido: 123.456.789-09
CPF Inválido: 111.111.111-11
```

### Teste de CNPJ
```
CNPJ Válido: 11.222.333/0001-81
CNPJ Inválido: 11.111.111/1111-11
```

### Teste de CEP
```
CEP Válido: 01310-100 (Av. Paulista, SP)
CEP Inválido: 99999-999
```

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px (layout vertical, botões full-width)
- **Tablet**: 768px - 1024px (grid 2 colunas)
- **Desktop**: > 1024px (grid 2 colunas, modal centrado)

### Adaptações Mobile
- Formulário em coluna única
- Botões com altura otimizada para toque
- Campos com tamanho adequado para digitação

## 🎨 Padrões de Design

### Cores Utilizadas
- **Primary**: `brand-blue` (azul da marca)
- **Success**: Verde (#22c55e)
- **Error**: Vermelho (#ef4444)
- **Warning**: Amarelo (#f59e0b)

### Componentes UI
- **shadcn/ui**: Biblioteca base de componentes
- **Lucide React**: Ícones consistentes
- **Tailwind CSS**: Estilização utilitária

## 🔒 Segurança e Validações

### Validações Implementadas
- **CPF/CNPJ**: Algoritmos oficiais brasileiros
- **E-mail**: Regex padrão RFC 5322
- **Telefone**: Mínimo 10 dígitos
- **CEP**: Exatamente 8 dígitos
- **Campos obrigatórios**: Verificação antes do envio

### Tratamento de Erros
- Mensagens específicas por tipo de erro
- Retry automático em falhas de rede
- Fallback para campos de endereço

## 📊 Monitoramento

### Logs Implementados
- Erros de validação de CPF/CNPJ
- Falhas na consulta de CEP
- Erros na API do Tiny
- Submissões bem-sucedidas

### Métricas Disponíveis
- Taxa de conversão do formulário
- Tempo médio de preenchimento
- Campos com mais erros de validação

## 🚀 Deploy e Integração

### Pré-requisitos
1. Token válido da API Tiny
2. Configuração de CORS para ViaCEP
3. Certificado SSL (HTTPS obrigatório)

### Configuração Tiny ERP
1. Obter token de API no painel Tiny
2. Configurar permissões para criação de contatos
3. Testar endpoint com Postman

### Configuração do Projeto
```bash
# Instalar dependências
npm install

# Configurar variável de ambiente
echo "VITE_TINY_API_TOKEN=seu_token" > .env

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎯 Próximos Passos

### Melhorias Planejadas
- [ ] Integração com Google Analytics
- [ ] Captcha para prevenção de spam
- [ ] Upload de documentos (RG, CNH)
- [ ] Integração com WhatsApp API
- [ ] Dashboard de conversões

### Integrações Futuras
- [ ] CRM adicional (HubSpot, Salesforce)
- [ ] Sistema de notificações push
- [ ] E-mail marketing automatizado
- [ ] SMS de confirmação

## 🆘 Troubleshooting

### Problemas Comuns

**Erro na API Tiny**
```
Solução: Verificar token e permissões
```

**CEP não encontrado**
```
Solução: Permitir preenchimento manual dos campos
```

**Validação de CPF/CNPJ falsa**
```
Solução: Verificar implementação dos algoritmos
```

### Suporte
- **Documentação Tiny**: https://tiny.com.br/api-docs
- **ViaCEP**: https://viacep.com.br/
- **Repositório**: Link do projeto no Git

---

## 📝 Notas de Desenvolvimento

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint + Prettier**: Formatação consistente
- **Componentes funcionais**: Hooks modernos do React
- **Responsabilidade única**: Separação clara de concerns

### Performance
- **Lazy loading**: Carregamento sob demanda
- **Debounce**: Validações com delay
- **Memoização**: Componentes otimizados
- **Bundle splitting**: Chunks separados por rota

### Acessibilidade (WCAG 2.1 AA)
- **Navegação por teclado**: Tab order correto
- **Screen readers**: ARIA labels apropriados
- **Contraste**: Cores acessíveis
- **Foco visível**: Indicadores claros

Esta documentação deve ser mantida atualizada conforme novas funcionalidades são implementadas. 