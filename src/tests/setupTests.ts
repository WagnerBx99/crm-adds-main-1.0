import '@testing-library/jest-dom';

// Mock global para a biblioteca toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Configuração global para componentes que usam rotas
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/configuracoes/backup'
  })
}));

// Mock para os serviços que serão testados isoladamente
jest.mock('../services/backup/BackupService');
jest.mock('../services/backup/StorageService');
jest.mock('../services/security/EncryptionService');
jest.mock('../lib/security/notificationService');

// Configuração de ambiente de teste
process.env.NODE_ENV = 'test';
process.env.BACKUP_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests'; 