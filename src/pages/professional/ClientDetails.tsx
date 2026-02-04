import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import { documentService } from '@/services/documentService';
import { Client, UserProfile, DocumentFile } from '@/types';
import { toast, Toaster } from 'sonner';
import { ArrowLeft, FileText, CheckSquare, Info, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UploadModal } from '@/components/documents/UploadModal';
import { DocumentList } from '@/components/documents/DocumentList';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { todoService } from '@/services/todoService';
import { Todo } from '@/types';
import { TodoList } from '@/components/todos/TodoList';
import { TodoModal } from '@/components/todos/TodoModal';

export function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents'>('overview');
    const [assignedProfessionals, setAssignedProfessionals] = useState<UserProfile[]>([]);

    // Documents State
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Todos State
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

    // Confirm Actions
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
        if (id) {
            loadData(id);
            loadDocuments(id);
            loadTodos(id);
        }
    }, [id]);

    const loadData = async (clientId: string) => {
        setLoading(true);
        try {
            const data = await clientService.getById(clientId);
            if (!data) {
                toast.error('Cliente não encontrado');
                navigate('/professional/clients');
                return;
            }

            // Security check: if not admin, check assignment
            if (profile?.role === 'professional') {
                const isAssigned = data.assignedProfessionalIds?.includes(profile.uid);
                if (!isAssigned) {
                    toast.error('Você não tem acesso a este cliente');
                    navigate('/professional/clients');
                    return;
                }
            }

            setClient(data);

            // Load assigned professionals details
            if (data.assignedProfessionalIds?.length) {
                const allUsers = await userService.getAll(); // Optimization potential
                const pros = allUsers.filter(u => data.assignedProfessionalIds?.includes(u.uid));
                setAssignedProfessionals(pros);
            }

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar detalhes');
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async (clientId: string) => {
        try {
            const docs = await documentService.getByClientId(clientId, profile ? { uid: profile.uid, role: profile.role } : undefined);
            setDocuments(docs);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar documentos');
        }
    };

    const loadTodos = async (clientId: string) => {
        try {
            const list = await todoService.getByClientId(clientId, profile ? { uid: profile.uid, role: profile.role } : undefined);
            setTodos(list);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar pendências');
        }
    };

    const handleResolveTodo = async (todo: Todo) => {
        if (!profile) return;
        try {
            await todoService.updateStatus(todo.id, 'resolved', profile.uid);
            toast.success('Pendência resolvida!');
            if (client) loadTodos(client.id);
        } catch (error) {
            toast.error('Erro ao atualizar pendência');
        }
    };

    const handleDocumentStatus = async (doc: DocumentFile, status: 'approved' | 'rejected') => {
        try {
            await documentService.updateStatus(doc.id, status);
            toast.success(`Documento ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`);
            if (client) loadDocuments(client.id);
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleDeleteDocument = (doc: DocumentFile) => {
        setConfirmConfig({
            open: true,
            title: 'Excluir Documento',
            description: `Tem certeza que deseja excluir "${doc.fileName}"?`,
            variant: 'destructive',
            onConfirm: async () => {
                if (client) {
                    await documentService.delete(doc.id, doc.filePath);
                    toast.success('Documento excluído!');
                    loadDocuments(client.id);
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${client.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {client.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span>•</span>
                        <span>Cadastrado em {client.createdAt?.toDate?.().toLocaleDateString() || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'overview'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Info className="w-4 h-4 mr-2" />
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'tasks'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Pendências
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                            {todos.filter(t => t.status === 'open').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'documents'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Documentos
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                            {documents.length}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'overview' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Nome da Empresa</label>
                                <div className="mt-1 text-sm text-gray-900">{client.name}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1 text-sm text-gray-900">{client.active ? 'Ativo' : 'Inativo'}</div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Equipe Técnica Atribuída</label>
                                <div className="flex flex-wrap gap-2">
                                    {assignedProfessionals.length > 0 ? assignedProfessionals.map(pro => (
                                        <div key={pro.uid} className="flex items-center bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                                            <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold mr-2">
                                                {pro.name[0]}
                                            </div>
                                            <span className="text-sm text-gray-700">{pro.name}</span>
                                        </div>
                                    )) : (
                                        <span className="text-sm text-gray-400 italic">Nenhum profissional atribuído.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Pendências</h3>
                            <button
                                onClick={() => setIsTodoModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Nova Pendência
                            </button>
                        </div>

                        <TodoList
                            todos={todos}
                            onResolve={handleResolveTodo}
                        />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Novo Documento
                            </button>
                        </div>

                        <DocumentList
                            documents={documents}
                            onStatusChange={handleDocumentStatus}
                            onDelete={handleDeleteDocument}
                        />
                    </div>
                )}
            </div>

            {client && (
                <UploadModal
                    open={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    client={client}
                    onSuccess={() => loadDocuments(client.id)}
                />
            )}

            {client && (
                <TodoModal
                    open={isTodoModalOpen}
                    onOpenChange={setIsTodoModalOpen}
                    client={client}
                    onSuccess={() => loadTodos(client.id)}
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
