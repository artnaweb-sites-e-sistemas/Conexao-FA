import { useEffect, useState } from 'react';
import { userService, Invite } from '@/services/userService';
import { UserProfile } from '@/types';
import { Plus, Trash2, Mail, Power } from 'lucide-react';
import { InviteDialog } from '@/components/users/InviteDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast, Toaster } from 'sonner';
import clsx from 'clsx';
import { format } from 'date-fns';

export function Users() {
    const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => Promise<void>;
        variant?: 'default' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: async () => { },
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const data = await userService.getAll();
                setUsers(data);
            } else {
                const data = await userService.getAllInvites();
                setInvites(data);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async (data: any) => {
        try {
            await userService.createInvite(data);
            toast.success('Convite criado com sucesso!');
            if (activeTab === 'invites') loadData();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar convite');
        }
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este convite?')) return;
        try {
            await userService.deleteInvite(id);
            toast.success('Convite removido!');
            loadData();
        } catch (error) {
            toast.error('Erro ao remover convite');
        }
    };

    const handleToggleUserActive = (user: UserProfile) => {
        const action = user.active ? 'desativar' : 'ativar';

        setConfirmConfig({
            open: true,
            title: `${user.active ? 'Desativar' : 'Ativar'} Usuário`,
            description: `Tem certeza que deseja ${action} o usuário "${user.name}"? Ele ${user.active ? 'perderá' : 'terá'} acesso ao sistema.`,
            variant: user.active ? 'destructive' : 'default',
            onConfirm: async () => {
                await userService.update(user.uid, { active: !user.active });
                toast.success(`Usuário ${user.active ? 'desativado' : 'ativado'}!`);
                loadData();
            }
        });
    };

    const handleDeleteUser = (user: UserProfile) => {
        setConfirmConfig({
            open: true,
            title: 'Excluir Usuário',
            description: `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
            variant: 'destructive',
            onConfirm: async () => {
                await userService.deleteUser(user.uid);
                toast.success('Usuário excluído!');
                loadData();
            }
        });
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-800',
            professional: 'bg-blue-100 text-blue-800',
            client: 'bg-green-100 text-green-800'
        };
        // @ts-ignore
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
            {role === 'professional' ? 'Profissional' : role === 'client' ? 'Cliente' : 'Administrador'}
        </span>
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                    <p className="text-gray-500">Gerencie quem tem acesso ao sistema</p>
                </div>
                <button
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Usuário
                </button>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={clsx(
                            activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
                        )}
                    >
                        Usuários Ativos
                    </button>
                    <button
                        onClick={() => setActiveTab('invites')}
                        className={clsx(
                            activeTab === 'invites' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
                        )}
                    >
                        Convites Pendentes
                    </button>
                </nav>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : activeTab === 'users' ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {users.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum usuário encontrado.</p>}
                        {users.map((user) => (
                            <li key={user.uid}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold uppercase ${user.active ? 'bg-gray-200 text-gray-500' : 'bg-red-100 text-red-400'}`}>
                                            {user.name?.[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className={`text-sm font-medium ${user.active ? 'text-primary-600' : 'text-gray-400 line-through'}`}>{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {getRoleBadge(user.role)}
                                        <span className={`px-2 py-1 text-xs rounded ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleUserActive(user)}
                                            className={`p-2 rounded-full transition-colors ${user.active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                                            title={user.active ? 'Desativar usuário' : 'Ativar usuário'}
                                        >
                                            <Power className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Excluir usuário"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {invites.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum convite pendente.</p>}
                        {invites.map((invite) => (
                            <li key={invite.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                                            <div className="text-sm text-gray-500">
                                                Para: {invite.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {getRoleBadge(invite.role)}
                                        <div className="text-sm text-gray-400">
                                            {invite.createdAt?.toDate ? format(invite.createdAt.toDate(), 'dd/MM/yyyy') : 'Hoje'}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteInvite(invite.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <InviteDialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
                onSubmit={handleCreateInvite}
            />

            <ConfirmDialog
                open={confirmConfig.open}
                onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
                title={confirmConfig.title}
                description={confirmConfig.description}
                onConfirm={confirmConfig.onConfirm}
                variant={confirmConfig.variant}
            />
        </div>
    );
}
