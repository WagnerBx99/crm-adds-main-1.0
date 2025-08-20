import { User, UserRole, AuditLog, rolePermissions } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Simulação de criptografia de senha (em produção, use bcrypt ou similar)
const hashPassword = (password: string): string => {
  // Em um ambiente real, usaríamos bcrypt ou argon2
  // Esta é apenas uma simulação para fins de demonstração
  const salt = Math.random().toString(36).substring(2, 15);
  return `${salt}:${password}`;
};

const verifyPassword = (password: string, hash: string): boolean => {
  // Em um ambiente real, usaríamos bcrypt.compare ou similar
  // Esta é apenas uma simulação para fins de demonstração
  const [salt, storedPassword] = hash.split(':');
  return password === storedPassword;
};

// Usuário padrão para inicialização
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@exemplo.com',
    passwordHash: hashPassword('admin123'),
    role: 'MASTER',
    active: true,
    createdAt: new Date(),
    department: 'Administração'
  }
];

// Logs de auditoria
const auditLogs: AuditLog[] = [];

class UserService {
  private users: User[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.loadUsers();
    
    // Forçar criação de usuário MASTER no localStorage se não existir
    if (!this.currentUser) {
      console.log('Forçando criação de usuário MASTER');
      const adminUser = this.users.find(u => u.role === 'MASTER');
      if (adminUser) {
        this.currentUser = adminUser;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        console.log('Usuário MASTER definido:', this.currentUser);
      }
    }
  }

  // Carregar usuários do localStorage
  private loadUsers(): void {
    try {
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        // Inicializar com usuários padrão se não houver dados
        this.users = defaultUsers;
        this.saveUsers();
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      this.users = defaultUsers;
      this.saveUsers();
    }
  }

  // Salvar usuários no localStorage
  private saveUsers(): void {
    try {
      localStorage.setItem('users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
      toast.error('Erro ao salvar usuários. Verifique o console para mais detalhes.');
    }
  }

  // Registrar ação de auditoria
  private logAudit(action: string, entityType: string, entityId?: string, details?: string): void {
    const log: AuditLog = {
      id: uuidv4(),
      userId: this.currentUser?.id || 'system',
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
      ipAddress: '127.0.0.1' // Em um ambiente real, obteríamos o IP real
    };

    auditLogs.push(log);
    
    // Em um ambiente real, salvaríamos em um banco de dados
    try {
      const storedLogs = localStorage.getItem('auditLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.push(log);
      localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error);
    }
  }

  // Obter todos os usuários
  getUsers(): User[] {
    return this.users;
  }

  // Obter usuário por ID
  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  // Obter usuário por email
  getUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Criar novo usuário
  createUser(userData: Omit<User, 'id' | 'passwordHash' | 'createdAt'> & { password: string }): User | null {
    // Verificar se o email já existe
    if (this.getUserByEmail(userData.email)) {
      toast.error('Este email já está em uso');
      return null;
    }

    // Verificar permissões para criar usuários Master
    if (userData.role === 'MASTER' && this.currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para criar usuários Master');
      return null;
    }

    const newUser: User = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      passwordHash: hashPassword(userData.password),
      role: userData.role,
      active: userData.active,
      createdAt: new Date(),
      createdBy: this.currentUser?.id,
      phone: userData.phone,
      department: userData.department,
      avatar: userData.avatar
    };

    this.users.push(newUser);
    this.saveUsers();

    this.logAudit('create', 'user', newUser.id, `Usuário ${newUser.name} (${newUser.role}) criado`);
    toast.success('Usuário criado com sucesso');

    return newUser;
  }

  // Atualizar usuário existente
  updateUser(id: string, userData: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>> & { password?: string }): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      toast.error('Usuário não encontrado');
      return null;
    }

    const user = this.users[userIndex];

    // Verificar permissões para editar usuários Master
    if (user.role === 'MASTER' && this.currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para editar usuários Master');
      return null;
    }

    // Verificar permissões para promover usuários a Master
    if (userData.role === 'MASTER' && user.role !== 'MASTER' && this.currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para promover usuários a Master');
      return null;
    }

    // Atualizar dados do usuário
    const updatedUser: User = {
      ...user,
      ...userData,
      passwordHash: userData.password ? hashPassword(userData.password) : user.passwordHash
    };

    this.users[userIndex] = updatedUser;
    this.saveUsers();

    this.logAudit('update', 'user', updatedUser.id, `Usuário ${updatedUser.name} atualizado`);
    toast.success('Usuário atualizado com sucesso');

    return updatedUser;
  }

  // Excluir usuário
  deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return false;
    }

    // Verificar permissões para excluir usuários Master
    if (user.role === 'MASTER' && this.currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para excluir usuários Master');
      return false;
    }

    // Não permitir excluir o próprio usuário
    if (user.id === this.currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta');
      return false;
    }

    this.users = this.users.filter(u => u.id !== id);
    this.saveUsers();

    this.logAudit('delete', 'user', id, `Usuário ${user.name} excluído`);
    toast.success('Usuário excluído com sucesso');

    return true;
  }

  // Resetar senha do usuário
  resetPassword(id: string): string | null {
    const user = this.getUserById(id);
    
    if (!user) {
      toast.error('Usuário não encontrado');
      return null;
    }

    // Verificar permissões para resetar senha de usuários Master
    if (user.role === 'MASTER' && this.currentUser?.role !== 'MASTER') {
      toast.error('Você não tem permissão para resetar a senha de usuários Master');
      return null;
    }

    // Gerar senha temporária aleatória
    const tempPassword = Math.random().toString(36).substring(2, 10);
    
    // Atualizar a senha do usuário
    const userIndex = this.users.findIndex(u => u.id === id);
    this.users[userIndex] = {
      ...user,
      passwordHash: hashPassword(tempPassword),
      passwordResetAt: new Date()
    };
    this.saveUsers();

    this.logAudit('reset_password', 'user', id, `Senha do usuário ${user.name} foi resetada`);
    toast.success('Senha resetada com sucesso');

    return tempPassword;
  }

  // Autenticar usuário
  login(email: string, password: string): User | null {
    const user = this.getUserByEmail(email);
    
    if (!user) {
      toast.error('Email ou senha incorretos');
      return null;
    }

    if (!user.active) {
      toast.error('Esta conta está desativada');
      return null;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      toast.error('Email ou senha incorretos');
      return null;
    }

    // Atualizar último login
    const userIndex = this.users.findIndex(u => u.id === user.id);
    this.users[userIndex] = {
      ...user,
      lastLogin: new Date()
    };
    this.saveUsers();

    this.currentUser = this.users[userIndex];
    this.logAudit('login', 'user', user.id, 'Login bem-sucedido');
    
    // Salvar sessão
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    
    return this.currentUser;
  }

  // Encerrar sessão
  logout(): void {
    if (this.currentUser) {
      this.logAudit('logout', 'user', this.currentUser.id, 'Logout');
    }
    
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // Verificar se há um usuário logado
  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    console.log('getCurrentUser - currentUser inicial:', this.currentUser);
    if (!this.currentUser) {
      // Tentar recuperar da sessão
      try {
        const storedUser = localStorage.getItem('currentUser');
        console.log('getCurrentUser - storedUser do localStorage:', storedUser);
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
          console.log('getCurrentUser - currentUser após parse:', this.currentUser);
        } else {
          // Se não houver usuário na sessão, usar o admin padrão temporariamente
          console.log('Nenhum usuário logado, usando admin padrão');
          this.currentUser = {
            id: '1',
            name: 'Administrador',
            email: 'admin@exemplo.com',
            passwordHash: '',  // Não precisamos da senha aqui
            role: 'MASTER',
            active: true,
            createdAt: new Date(),
            department: 'Administração'
          };
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
      }
    }
    
    return this.currentUser;
  }

  // Verificar se o usuário atual tem uma permissão específica
  hasPermission(permission: keyof import('@/types').RolePermissions): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return rolePermissions[user.role][permission];
  }

  // Obter logs de auditoria
  getAuditLogs(): AuditLog[] {
    try {
      const storedLogs = localStorage.getItem('auditLogs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      return [];
    }
  }
}

// Exportar uma instância única do serviço
export const userService = new UserService();
