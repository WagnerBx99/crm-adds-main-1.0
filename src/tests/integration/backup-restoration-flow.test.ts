import { BackupService } from '../../services/backup/BackupService';
import { StorageService } from '../../services/backup/StorageService';
import { EncryptionService } from '../../services/security/EncryptionService';
import { NotificationService } from '../../lib/security/notificationService';
import { DatabaseService } from '../../services/database/DatabaseService';

describe('Fluxo Completo de Backup e Restauração', () => {
  // Serviços reais para teste de integração
  let backupService: BackupService;
  let storageService: StorageService;
  let encryptionService: EncryptionService;
  let notificationService: NotificationService;
  let databaseService: DatabaseService;
  
  // Variáveis para manter estado entre testes
  let testBackupId: string;
  
  beforeAll(async () => {
    // Inicializa serviços com instâncias reais (não mockadas)
    storageService = new StorageService();
    encryptionService = new EncryptionService();
    notificationService = new NotificationService();
    databaseService = new DatabaseService();
    
    backupService = new BackupService(
      storageService,
      encryptionService,
      notificationService
    );
    
    // Prepara ambiente de teste - cria dados temporários para backup
    await databaseService.insertTestData();
  });
  
  afterAll(async () => {
    // Limpa ambiente após testes
    await databaseService.clearTestData();
    await storageService.cleanupTestBackups();
  });
  
  test('1. Deve criar um backup completo corretamente', async () => {
    // Monitora eventos de notificação
    const notifySpy = jest.spyOn(notificationService, 'notify');
    
    // Executa backup completo
    const backupResult = await backupService.createBackup('completo');
    
    // Guarda ID para testes subsequentes
    testBackupId = backupResult.id;
    
    // Verificações
    expect(backupResult).toEqual(expect.objectContaining({
      type: 'completo',
      status: 'concluido',
      encrypted: true
    }));
    
    // Verifica se o arquivo de backup existe no armazenamento
    const backupExists = await storageService.backupExists(testBackupId);
    expect(backupExists).toBe(true);
    
    // Verifica notificação
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'backup_success',
        message: expect.stringContaining('Backup completo concluído')
      })
    );
  }, 30000); // Timeout maior para operação de backup
  
  test('2. Deve listar o backup criado no histórico', async () => {
    // Obtém histórico de backups
    const history = await backupService.getBackupHistory();
    
    // Verifica se o backup criado está na lista
    const createdBackup = history.find(b => b.id === testBackupId);
    expect(createdBackup).toBeTruthy();
    expect(createdBackup?.type).toBe('completo');
    expect(createdBackup?.status).toBe('concluido');
  });
  
  test('3. Deve verificar integridade do backup', async () => {
    // Executa verificação de integridade
    const integrityResult = await backupService.verifyBackupIntegrity(testBackupId);
    
    // Verificações
    expect(integrityResult).toEqual(expect.objectContaining({
      isValid: true,
      checksumMatch: true
    }));
  });
  
  test('4. Deve alterar dados do banco para simular cenário de restauração', async () => {
    // Simula modificação de dados que precisarão ser restaurados
    const modificationResult = await databaseService.modifyTestData();
    
    // Verifica se os dados foram modificados
    expect(modificationResult).toBe(true);
    
    // Verifica se os dados atuais são diferentes dos originais
    const dataIsModified = await databaseService.verifyDataModified();
    expect(dataIsModified).toBe(true);
  });
  
  test('5. Deve restaurar o backup corretamente', async () => {
    // Monitora eventos de notificação
    const notifySpy = jest.spyOn(notificationService, 'notify');
    
    // Executa restauração
    const restoreResult = await backupService.restoreBackup(testBackupId, {
      restoreDatabase: true,
      restoreFiles: true
    });
    
    // Verificações
    expect(restoreResult).toBe(true);
    
    // Verifica se os dados foram restaurados corretamente
    const dataIsOriginal = await databaseService.verifyDataOriginal();
    expect(dataIsOriginal).toBe(true);
    
    // Verifica notificação
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'restore_success',
        message: expect.stringContaining('Restauração concluída')
      })
    );
  }, 45000); // Timeout maior para operação de restauração
  
  test('6. Deve validar métricas de desempenho', async () => {
    // Obtém métricas do serviço
    const metrics = await backupService.getPerformanceMetrics();
    
    // Verificações
    expect(metrics).toEqual(expect.objectContaining({
      averageBackupTime: expect.any(Number),
      averageRestoreTime: expect.any(Number),
      successRate: expect.any(Number)
    }));
    
    // Verifica se as métricas estão dentro de parâmetros aceitáveis
    expect(metrics.successRate).toBeGreaterThanOrEqual(95);
    expect(metrics.averageBackupTime).toBeLessThan(300); // menos de 5 minutos
    expect(metrics.averageRestoreTime).toBeLessThan(600); // menos de 10 minutos
  });
}); 