import { useEffect, useState } from 'react';
import { clientService } from '@/services/clientService';
import { Client } from '@/types';
import { Plus, Edit2, Users as UsersIcon, Search, Power, Trash2, Eye } from 'lucide-react';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { AssignDialog } from '@/components/clients/AssignDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

import { useNavigate } from 'react-router-dom';

export function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'admin';

    // Dialogs
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [assigningClient, setAssigningClient] = useState<Client | null>(null);

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
    }, [profile]);

    useEffect(() => {
        if (!search) {
            setFilteredClients(clients);
        } else {
            const lower = search.toLowerCase();
            setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(lower)));
        }
    }, [search, clients]);

    const loadData = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            let data: Client[] = [];
            if (profile.role === 'admin') {
                data = await clientService.getAll();
            } else if (profile.role === 'professional') {
                data = await clientService.getMyClients(profile.uid);
            }
            setClients(data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async (data: any) => {
        try {
            if (editingClient) {
                await clientService.update(editingClient.id, data);
                toast.success('Cliente atualizado!');
            } else {
                await clientService.create(data);
                toast.success('Cliente criado!');
            }
            setEditingClient(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar cliente');
        }
    };

    const handleToggleClientActive = (client: Client) => {
        const action = client.active ? 'desativar' : 'ativar';

        setConfirmConfig({
            open: true,
            title: `${client.active ? 'Desativar' : 'Ativar'} Cliente`,
            description: `Tem certeza que deseja ${action} o cliente "${client.name}"?`,
            variant: client.active ? 'destructive' : 'default',
            onConfirm: async () => {
                await clientService.update(client.id, { active: !client.active });
                toast.success(`Cliente ${client.active ? 'desativado' : 'ativado'}!`);
                loadData();
            }
        });
    };

    const handleDeleteClient = (client: Client) => {
        setConfirmConfig({
            open: true,
            title: 'Excluir Cliente',
            description: `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o cliente "${client.name}"? Todos os dados associados serão perdidos.`,
            variant: 'destructive',
            onConfirm: async () => {
                await clientService.delete(client.id);
                toast.success('Cliente excluído!');
                loadData();
            }
        });
    };

    const openAssign = (client: Client) => {
        setAssigningClient(client);
        setIsAssignDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
                    <p className="text-gray-500">
                        {isAdmin ? 'Gerencie clientes e atribuições' : 'Meus clientes atribuídos'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { setEditingClient(null); setIsClientDialogOpen(true); }}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Cliente
                    </button>
                )}
            </div>

            <div className="flex items-center bg-white p-2 rounded-md shadow-sm border border-gray-200 w-full max-w-sm">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    className="flex-1 outline-none text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {filteredClients.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum cliente encontrado.</p>}
                        {filteredClients.map((client) => (
                            <li key={client.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                                            {client.name[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-primary-600">{client.name}</div>
                                            <div className="text-xs text-gray-400">
                                                Criado em: {client.createdAt?.toDate ? format(client.createdAt.toDate(), 'dd/MM/yyyy') : '-'}
                                            </div>
                                            {/* Show assigned count */}
                                            <div className="flex items-center mt-1">
                                                <UsersIcon className="w-3 h-3 text-gray-400 mr-1" />
                                                <span className="text-xs text-gray-500">
                                                    {client.assignedProfessionalIds?.length || 0} profissionais
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {client.active ? 'Ativo' : 'Inativo'}
                                        </span>

                                        {isAdmin ? (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/clients/${client.id}`)}
                                                    className="p-2 text-gray-400 hover:text-primary-600"
                                                    title="Ver Detalhes e Pendências"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openAssign(client)}
                                                    className="p-2 text-gray-400 hover:text-gray-600"
                                                    title="Atribuir Profissionais"
                                                >
                                                    <UsersIcon className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => { setEditingClient(client); setIsClientDialogOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-primary-600"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => handleToggleClientActive(client)}
                                                    className={`p-2 rounded-full transition-colors ${client.active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                                                    title={client.active ? 'Desativar cliente' : 'Ativar cliente'}
                                                >
                                                    <Power className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClient(client)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Excluir cliente"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/professional/clients/${client.id}`)}
                                                className="p-2 text-gray-400 hover:text-primary-600"
                                                title="Ver detalhes"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <ClientDialog
                open={isClientDialogOpen}
                onOpenChange={setIsClientDialogOpen}
                onSubmit={handleSaveClient}
                initialData={editingClient}
            />

            {assigningClient && (
                <AssignDialog
                    open={isAssignDialogOpen}
                    onOpenChange={(open) => { setIsAssignDialogOpen(open); if (!open) setAssigningClient(null); }}
                    clientId={assigningClient.id}
                    currentAssignees={assigningClient.assignedProfessionalIds || []}
                    onSuccess={loadData}
                />
            )}

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
