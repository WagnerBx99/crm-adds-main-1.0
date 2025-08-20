export * from './types';
export * from './api';
export * from './service';

// Instância padrão do serviço de integração
import { TinyIntegrationService } from './service';
export const tinyService = new TinyIntegrationService(); 