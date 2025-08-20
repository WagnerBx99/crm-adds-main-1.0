import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from 'lucide-react';
import { rolePermissions, UserRole } from '@/types';

// Interface para agrupar permissões por categoria
interface PermissionGroup {
  title: string;
  permissions: Array<{
    key: keyof typeof rolePermissions.MASTER;
    label: string;
    description: string;
  }>;
}

// Agrupamento das permissões por categoria para melhor visualização
const permissionGroups: PermissionGroup[] = [
  {
    title: "Gestão de Usuários",
    permissions: [
      { key: "canManageUsers", label: "Gerenciar Usuários", description: "Acesso geral à gestão de usuários" },
      { key: "canManageMasters", label: "Gerenciar Administradores", description: "Criar/editar usuários com perfil Master" },
      { key: "canViewUsers", label: "Visualizar Usuários", description: "Ver lista de usuários do sistema" },
      { key: "canCreateUsers", label: "Criar Usuários", description: "Adicionar novos usuários" },
      { key: "canEditUsers", label: "Editar Usuários", description: "Modificar usuários existentes" },
      { key: "canDeleteUsers", label: "Excluir Usuários", description: "Remover usuários do sistema" },
      { key: "canResetUserPasswords", label: "Resetar Senhas", description: "Resetar senhas de outros usuários" },
    ]
  },
  {
    title: "Configurações do Sistema",
    permissions: [
      { key: "canAccessSettings", label: "Acesso a Configurações", description: "Acessar menu de configurações" },
      { key: "canAccessCriticalSettings", label: "Config. Críticas", description: "Alterar configurações sensíveis" },
      { key: "canManageSecuritySettings", label: "Config. de Segurança", description: "Gerenciar parâmetros de segurança" },
      { key: "canViewAuditLogs", label: "Ver Logs de Auditoria", description: "Acessar registros de atividade" },
      { key: "canExportAuditLogs", label: "Exportar Logs", description: "Baixar registros de auditoria" },
    ]
  },
  {
    title: "Gerenciamento de Ordens",
    permissions: [
      { key: "canManageKanban", label: "Gerenciar Kanban", description: "Configurar quadro Kanban" },
      { key: "canCreateOrders", label: "Criar Ordens", description: "Adicionar novas ordens" },
      { key: "canEditOrders", label: "Editar Ordens", description: "Modificar ordens existentes" },
      { key: "canDeleteOrders", label: "Excluir Ordens", description: "Remover ordens do sistema" },
      { key: "canChangeOrderStatus", label: "Alterar Status", description: "Mudar status das ordens" },
      { key: "canAssignTasks", label: "Atribuir Tarefas", description: "Designar usuários às ordens" },
      { key: "canViewAllOrders", label: "Ver Todas Ordens", description: "Visualizar todas as ordens" },
      { key: "canViewOwnOrders", label: "Ver Ordens Próprias", description: "Ver apenas ordens atribuídas a si" },
      { key: "canApproveOrders", label: "Aprovar Ordens", description: "Aprovar ordens para produção" },
      { key: "canRejectOrders", label: "Rejeitar Ordens", description: "Rejeitar ordens para ajustes" },
    ]
  },
  {
    title: "Gestão de Clientes",
    permissions: [
      { key: "canManageCustomers", label: "Gerenciar Clientes", description: "Acesso geral à gestão de clientes" },
      { key: "canViewCustomers", label: "Visualizar Clientes", description: "Ver cadastros de clientes" },
      { key: "canCreateCustomers", label: "Criar Clientes", description: "Adicionar novos clientes" },
      { key: "canEditCustomers", label: "Editar Clientes", description: "Modificar dados de clientes" },
      { key: "canDeleteCustomers", label: "Excluir Clientes", description: "Remover clientes do sistema" },
    ]
  },
  {
    title: "Relatórios e Análises",
    permissions: [
      { key: "canViewReports", label: "Visualizar Relatórios", description: "Acesso a relatórios do sistema" },
      { key: "canExportReports", label: "Exportar Relatórios", description: "Exportar dados para formatos externos" },
      { key: "canCreateCustomReports", label: "Relatórios Personalizados", description: "Criar consultas personalizadas" },
    ]
  },
  {
    title: "Ferramentas e Utilitários",
    permissions: [
      { key: "canManageLabels", label: "Gerenciar Rótulos", description: "Criar e editar rótulos" },
      { key: "canManageNotifications", label: "Gerenciar Notificações", description: "Configurar sistema de notificações" },
      { key: "canUploadFiles", label: "Enviar Arquivos", description: "Fazer upload de arquivos" },
      { key: "canDownloadFiles", label: "Baixar Arquivos", description: "Fazer download de arquivos" },
      { key: "canDeleteFiles", label: "Excluir Arquivos", description: "Remover arquivos do sistema" },
    ]
  }
];

// Componente para exibição da matriz de permissões
export function PermissionsMatrix() {
  // Função para renderizar indicador de permissão
  const renderPermissionIndicator = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-red-500" />
    );
  };

  // Função para obter a cor do badge baseada no papel
  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case 'MASTER':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'GESTOR':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'PRESTADOR':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Matriz de Permissões</h2>
      <p className="text-muted-foreground">
        Visão detalhada das permissões de acesso por perfil de usuário.
      </p>

      <div className="bg-white rounded-md shadow overflow-hidden">
        <Table>
          <TableCaption>Matriz de permissões detalhada por perfil de usuário</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Permissão</TableHead>
              <TableHead className="w-[200px]">Descrição</TableHead>
              <TableHead className="text-center">
                <Badge className={getRoleBadgeColor('MASTER')}>MASTER</Badge>
              </TableHead>
              <TableHead className="text-center">
                <Badge className={getRoleBadgeColor('GESTOR')}>GESTOR</Badge>
              </TableHead>
              <TableHead className="text-center">
                <Badge className={getRoleBadgeColor('PRESTADOR')}>PRESTADOR</Badge>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionGroups.map((group) => (
              <React.Fragment key={group.title}>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="font-bold">
                    {group.title}
                  </TableCell>
                </TableRow>
                {group.permissions.map((permission) => (
                  <TableRow key={permission.key}>
                    <TableCell className="font-medium">{permission.label}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {permission.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionIndicator(rolePermissions.MASTER[permission.key])}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionIndicator(rolePermissions.GESTOR[permission.key])}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionIndicator(rolePermissions.PRESTADOR[permission.key])}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 