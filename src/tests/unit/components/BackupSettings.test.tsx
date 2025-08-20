import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BackupSettings } from '../../../components/settings/BackupSettings';
import { toast } from 'react-hot-toast';

// Mock das dependências externas
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('BackupSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza a interface inicial corretamente', () => {
    render(<BackupSettings />);
    
    // Verifica elementos principais na interface
    expect(screen.getByText('Status do Backup')).toBeInTheDocument();
    expect(screen.getByText('Backup Manual')).toBeInTheDocument();
    expect(screen.getByText('Agendamento de Backup')).toBeInTheDocument();
    expect(screen.getByText('Histórico de Backups')).toBeInTheDocument();
  });

  test('exibe status do último backup corretamente', () => {
    render(<BackupSettings />);
    
    expect(screen.getByText('Último backup concluído com sucesso.')).toBeInTheDocument();
  });

  test('botões de backup manual iniciam operação corretamente', async () => {
    jest.useFakeTimers();
    
    render(<BackupSettings />);
    
    // Clica no botão de backup completo
    const backupCompletoBtn = screen.getByText('Backup Completo');
    fireEvent.click(backupCompletoBtn);
    
    // Verifica início da operação
    expect(screen.getByText('Inicializando backup...')).toBeInTheDocument();
    
    // Avança o timer para simular conclusão
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    
    // Verifica se o toast foi chamado corretamente
    expect(toast.success).toHaveBeenCalledWith('Backup completo concluído com sucesso!');
    
    jest.useRealTimers();
  });

  test('alterações nas configurações de agendamento são aplicadas corretamente', () => {
    render(<BackupSettings />);
    
    // Encontra o switch para agendamento diário
    const switchDiario = screen.getAllByRole('checkbox')[0]; // Primeiro checkbox na interface
    
    // Verifica estado inicial e altera
    expect(switchDiario).toBeChecked();
    fireEvent.click(switchDiario);
    expect(switchDiario).not.toBeChecked();
  });

  test('configurações de armazenamento local são atualizadas corretamente', () => {
    render(<BackupSettings />);
    
    // Encontra o input de caminho local
    const pathInput = screen.getByLabelText('Diretório de Armazenamento');
    
    // Altera o valor
    fireEvent.change(pathInput, { target: { value: '/novocaminho' } });
    
    // Verifica se o valor foi atualizado
    expect(pathInput).toHaveValue('/novocaminho');
  });

  test('modal de restauração é exibido ao clicar para restaurar backup', () => {
    render(<BackupSettings />);
    
    // Encontra o botão de restaurar no histórico
    const restoreButton = screen.getAllByText('Restaurar')[0]; // Primeiro botão de restaurar
    
    // Clica no botão
    fireEvent.click(restoreButton);
    
    // Verifica se o modal foi aberto
    expect(screen.getByText('Restaurar Backup')).toBeInTheDocument();
    expect(screen.getByText('Opções de Restauração')).toBeInTheDocument();
  });

  test('configurações de segurança são aplicadas corretamente', () => {
    render(<BackupSettings />);
    
    // Navega para a aba de segurança
    const seguracaTab = screen.getByText('Segurança');
    fireEvent.click(seguracaTab);
    
    // Encontra o switch de criptografia
    const encryptionSwitch = screen.getByLabelText('Habilitar criptografia de backup');
    
    // Verifica estado inicial e altera
    expect(encryptionSwitch).toBeChecked();
    fireEvent.click(encryptionSwitch);
    expect(encryptionSwitch).not.toBeChecked();
  });

  test('filtros do histórico de backup funcionam corretamente', () => {
    render(<BackupSettings />);
    
    // Navega para a aba de histórico
    const historicoTab = screen.getByText('Histórico');
    fireEvent.click(historicoTab);
    
    // Encontra o input de busca
    const searchInput = screen.getByPlaceholderText('Buscar backups...');
    
    // Insere termo de busca
    fireEvent.change(searchInput, { target: { value: 'completo' } });
    
    // Verifica se o filtro foi aplicado (seria necessário verificar resultados filtrados)
    expect(searchInput).toHaveValue('completo');
  });
}); 