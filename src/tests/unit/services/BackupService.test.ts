import { BackupService } from '../../../services/backup/BackupService';
import { StorageService } from '../../../services/backup/StorageService';
import { EncryptionService } from '../../../services/security/EncryptionService';
import { NotificationService } from '../../../lib/security/notificationService';

// Mocks para as dependências
jest.mock('../../../services/backup/StorageService');
jest.mock('../../../services/security/EncryptionService');
jest.mock('../../../lib/security/notificationService');

describe('BackupService', () => {
  let backupService: BackupService;
  let storageService: jest.Mocked<StorageService>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Limpa todos os mocks
    jest.clearAllMocks();
    
    // Configura os mocks
    storageService = new StorageService() as jest.Mocked<StorageService>;
    encryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;
    notificationService = new NotificationService() as jest.Mocked<NotificationService>;
    
    // Cria instância do serviço com as dependências mockadas
    backupService = new BackupService(
      storageService,
      encryptionService,
      notificationService
    );
  });

  describe('createBackup', () => {
    test('deve criar um backup completo com sucesso', async () => {
      // Configura os mocks
      const mockDbData = { tables: ['users', 'accounts'], data: Buffer.from('database-data') };
      const mockFileData = { files: ['config.json', 'settings.json'], data: Buffer.from('file-data') };
      
      // Mock para obtenção de dados
      (backupService as any).getDatabaseData = jest.fn().mockResolvedValue(mockDbData);
      (backupService as any).getFileData = jest.fn().mockResolvedValue(mockFileData);
      
      // Mock para criptografia
      encryptionService.encrypt.mockResolvedValue(Buffer.from('encrypted-data'));
      
      // Mock para armazenamento
      storageService.saveBackup.mockResolvedValue({
        id: '123',
        path: '/backups/full_20230101_120000.zip',
        size: '1.2 GB',
        timestamp: new Date()
      });
      
      // Executa o backup
      const result = await backupService.createBackup('completo');
      
      // Verifica se os métodos foram chamados corretamente
      expect(backupService.getDatabaseData).toHaveBeenCalled();
      expect(backupService.getFileData).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalled();
      expect(storageService.saveBackup).toHaveBeenCalled();
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'backup_success',
          severity: 'low'
        })
      );
      
      // Verifica o resultado
      expect(result).toEqual(expect.objectContaining({
        id: '123',
        type: 'completo',
        status: 'concluido'
      }));
    });

    test('deve criar um backup incremental com sucesso', async () => {
      // Configura os mocks
      const mockDbData = { tables: ['users'], data: Buffer.from('incremental-data') };
      const mockFileData = { files: ['settings.json'], data: Buffer.from('incremental-files') };
      
      // Mock para obtenção de dados
      (backupService as any).getDatabaseData = jest.fn().mockResolvedValue(mockDbData);
      (backupService as any).getFileData = jest.fn().mockResolvedValue(mockFileData);
      (backupService as any).getChangedSince = jest.fn().mockResolvedValue(new Date());
      
      // Mock para criptografia
      encryptionService.encrypt.mockResolvedValue(Buffer.from('encrypted-data'));
      
      // Mock para armazenamento
      storageService.saveBackup.mockResolvedValue({
        id: '124',
        path: '/backups/inc_20230102_120000.zip',
        size: '300 MB',
        timestamp: new Date()
      });
      
      // Executa o backup
      const result = await backupService.createBackup('incremental');
      
      // Verifica se os métodos foram chamados corretamente
      expect(backupService.getChangedSince).toHaveBeenCalled();
      expect(backupService.getDatabaseData).toHaveBeenCalled();
      expect(backupService.getFileData).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalled();
      expect(storageService.saveBackup).toHaveBeenCalled();
      
      // Verifica o resultado
      expect(result).toEqual(expect.objectContaining({
        id: '124',
        type: 'incremental',
        status: 'concluido'
      }));
    });

    test('deve lidar com erros durante o backup', async () => {
      // Mock para simular erro
      (backupService as any).getDatabaseData = jest.fn().mockRejectedValue(new Error('Erro de conexão com o banco'));
      
      // Executa o backup esperando erro
      await expect(backupService.createBackup('completo')).rejects.toThrow('Erro de conexão com o banco');
      
      // Verifica se a notificação de erro foi enviada
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'backup_error',
          severity: 'high'
        })
      );
    });
  });

  describe('restoreBackup', () => {
    test('deve restaurar um backup com sucesso', async () => {
      // Configura os mocks
      const backupId = '123';
      const backupData = {
        id: backupId,
        path: '/backups/full_20230101_120000.zip',
        type: 'completo',
        encrypted: true,
        data: Buffer.from('encrypted-backup-data')
      };
      
      // Mock para obtenção do backup
      storageService.getBackup.mockResolvedValue(backupData);
      
      // Mock para descriptografia
      encryptionService.decrypt.mockResolvedValue(Buffer.from('decrypted-data'));
      
      // Mock para métodos de restauração
      (backupService as any).restoreDatabase = jest.fn().mockResolvedValue(true);
      (backupService as any).restoreFiles = jest.fn().mockResolvedValue(true);
      
      // Executa a restauração
      const result = await backupService.restoreBackup(backupId, {
        restoreDatabase: true,
        restoreFiles: true
      });
      
      // Verifica se os métodos foram chamados corretamente
      expect(storageService.getBackup).toHaveBeenCalledWith(backupId);
      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(backupService.restoreDatabase).toHaveBeenCalled();
      expect(backupService.restoreFiles).toHaveBeenCalled();
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'restore_success',
          severity: 'medium'
        })
      );
      
      // Verifica o resultado
      expect(result).toBe(true);
    });

    test('deve lidar com erros durante a restauração', async () => {
      // Mock para simular erro
      storageService.getBackup.mockRejectedValue(new Error('Backup não encontrado'));
      
      // Executa a restauração esperando erro
      await expect(backupService.restoreBackup('123', { 
        restoreDatabase: true,
        restoreFiles: true 
      })).rejects.toThrow('Backup não encontrado');
      
      // Verifica se a notificação de erro foi enviada
      expect(notificationService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'restore_error',
          severity: 'critical'
        })
      );
    });
  });

  describe('getBackupHistory', () => {
    test('deve retornar o histórico de backups', async () => {
      // Configura o mock
      const mockHistory = [
        {
          id: '123',
          type: 'completo',
          dateTime: new Date(2023, 0, 1, 12, 0, 0),
          size: '1.2 GB',
          status: 'concluido'
        },
        {
          id: '124',
          type: 'incremental',
          dateTime: new Date(2023, 0, 2, 12, 0, 0),
          size: '300 MB',
          status: 'concluido'
        }
      ];
      
      storageService.getBackupHistory.mockResolvedValue(mockHistory);
      
      // Obtém o histórico
      const result = await backupService.getBackupHistory();
      
      // Verifica o resultado
      expect(result).toEqual(mockHistory);
      expect(storageService.getBackupHistory).toHaveBeenCalled();
    });

    test('deve filtrar o histórico por tipo', async () => {
      // Configura o mock
      const mockHistory = [
        {
          id: '123',
          type: 'completo',
          dateTime: new Date(2023, 0, 1, 12, 0, 0),
          size: '1.2 GB',
          status: 'concluido'
        },
        {
          id: '124',
          type: 'incremental',
          dateTime: new Date(2023, 0, 2, 12, 0, 0),
          size: '300 MB',
          status: 'concluido'
        }
      ];
      
      storageService.getBackupHistory.mockResolvedValue(mockHistory);
      
      // Obtém o histórico filtrado
      const result = await backupService.getBackupHistory({ type: 'completo' });
      
      // Verifica o resultado
      expect(result).toEqual([mockHistory[0]]);
    });
  });
}); 