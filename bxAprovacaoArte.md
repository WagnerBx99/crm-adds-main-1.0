# Sistema de Aprovação de Arte - CRM ADDS

**Data:** 24 de Janeiro de 2026  
**Versão:** 1.0.0

---

## 1. O que foi implementado

### 1.1 Backend (Node.js + PostgreSQL)

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/routes/artApproval.ts` | Rotas completas de aprovação de arte |
| `backend/src/services/emailService.ts` | Serviço de notificações por email |
| `backend/prisma/schema.prisma` | Modelos de arte com versionamento |

### 1.2 Rotas da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/art-approval/upload` | Upload de arte finalizada | ✅ |
| POST | `/api/art-approval/generate-link` | Gerar link público de aprovação | ✅ |
| POST | `/api/art-approval/new-version` | Upload de nova versão (após ajuste) | ✅ |
| GET | `/api/art-approval/history/:orderId` | Histórico de versões | ✅ |
| GET | `/api/art-approval/public/:token` | Dados para página pública | ❌ |
| POST | `/api/art-approval/public/:token/decide` | Processar decisão do cliente | ❌ |

### 1.3 Frontend (React)

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/services/artApprovalServiceBackend.ts` | Serviço de comunicação com backend |
| `src/hooks/useArtApproval.ts` | Hook React para gerenciar estado |
| `src/lib/services/apiService.ts` | Atualizado para suportar requisições públicas |

### 1.4 Funcionalidades Implementadas

- ✅ **Upload de arte finalizada** - Envio de arte para aprovação do cliente
- ✅ **Geração de link público** - Link único com expiração de 7 dias
- ✅ **Histórico de versões** - Mantém todas as versões anteriores da arte
- ✅ **Notificações por email** - Templates para cliente e equipe
- ✅ **Página pública de aprovação** - Cliente aprova ou solicita ajuste
- ✅ **Registro de feedback** - Comentários do cliente são salvos
- ✅ **Atualização automática de status** - Pedido muda de status conforme decisão

---

## 2. Fluxo de Aprovação

```
┌─────────────────┐
│  Upload Arte    │
│  (Prestador)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gerar Link     │
│  de Aprovação   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Email enviado  │────▶│  Cliente acessa │
│  ao cliente     │     │  link público   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌─────────────┐           ┌─────────────┐
           │  APROVAR    │           │  SOLICITAR  │
           │             │           │   AJUSTE    │
           └──────┬──────┘           └──────┬──────┘
                  │                         │
                  ▼                         ▼
           ┌─────────────┐           ┌─────────────┐
           │ Status:     │           │ Status:     │
           │ ARTE_APROVADA│          │ AJUSTE      │
           └─────────────┘           └──────┬──────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │ Nova versão │
                                    │ da arte     │
                                    └─────────────┘
```

---

## 3. Configuração de Email (SMTP)

Para habilitar o envio de emails, configure as variáveis de ambiente no backend:

```env
# Configuração SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=CRM ADDS <noreply@addsbrasil.com.br>
```

**Nota:** Para Gmail, use uma "Senha de App" em vez da senha normal.

### Templates de Email

1. **Arte pronta para aprovação** (para cliente)
   - Assunto: "Arte pronta para aprovação - {título do pedido}"
   - Conteúdo: Link de aprovação + prazo de expiração

2. **Arte aprovada** (para equipe)
   - Assunto: "Arte aprovada - {título do pedido}"
   - Conteúdo: Nome do cliente + detalhes do pedido

3. **Ajuste solicitado** (para equipe)
   - Assunto: "Ajuste solicitado - {título do pedido}"
   - Conteúdo: Feedback do cliente + detalhes do pedido

---

## 4. Histórico de Versões

O sistema mantém todas as versões da arte:

| Campo | Descrição |
|-------|-----------|
| `version` | Número da versão (1, 2, 3...) |
| `previousVersionId` | ID da versão anterior |
| `status` | pending, approved, adjustment_requested |
| `replacedAt` | Data em que foi substituída |
| `replacedById` | Usuário que fez a substituição |

### Consultar Histórico

```typescript
// Frontend
const { artworks, tokens } = await artApprovalServiceBackend.getArtworkHistory(orderId);

// Backend API
GET /api/art-approval/history/{orderId}
```

---

## 5. Segurança

- **Tokens únicos:** 32 bytes (64 caracteres hex)
- **Expiração:** 7 dias
- **Uso único:** Token é marcado como usado após decisão
- **Validação:** Verifica expiração e uso antes de processar

---

## 6. Próximos Passos (Sugestões)

1. **Configurar SMTP** - Habilitar envio real de emails
2. **Preview de múltiplas artes** - Aprovar várias artes de uma vez
3. **Download de arte** - Botão para cliente baixar em alta resolução
4. **Notificações push** - Alertas em tempo real na interface
5. **Relatórios** - Dashboard de aprovações por período

---

## 7. Arquivos Modificados

```
backend/
├── src/
│   ├── routes/
│   │   └── artApproval.ts (NOVO)
│   ├── services/
│   │   └── emailService.ts (NOVO)
│   └── server.ts (MODIFICADO)
├── prisma/
│   └── schema.prisma (MODIFICADO)
└── package.json (MODIFICADO)

src/
├── hooks/
│   └── useArtApproval.ts (NOVO)
└── lib/
    └── services/
        ├── apiService.ts (MODIFICADO)
        └── artApprovalServiceBackend.ts (NOVO)
```
