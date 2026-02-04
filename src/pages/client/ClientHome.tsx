import { useEffect, useState } from 'react';
import { clientService } from '@/services/clientService';
import { Client } from '@/types';
import { toast, Toaster } from 'sonner';
import { FileText, CheckSquare, Info, ShieldAlert, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { todoService } from '@/services/todoService';
import { documentService } from '@/services/documentService';
import { Todo, DocumentFile } from '@/types';
import { TodoList } from '@/components/todos/TodoList';
import { DocumentList } from '@/components/documents/DocumentList';
import { UploadModal } from '@/components/documents/UploadModal';

export function ClientHome() {
    const { profile } = useAuthStore();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents'>('overview');
    const [todos, setTodos] = useState<Todo[]>([]);
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        if (profile?.uid) loadData();
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!profile?.uid) return;
            const data = await clientService.getMyClientByUserId(profile.uid);
            setClient(data);

            if (data) {
                // Load Todos
                const todoList = await todoService.getByClientId(data.id, { uid: profile.uid, role: profile.role });
                setTodos(todoList);

                // Load Documents
                const docs = await documentService.getByClientId(data.id, { uid: profile.uid, role: profile.role });
                setDocuments(docs);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar informações');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveTodo = async (todo: Todo) => {
        if (!profile || !client) return;
        try {
            await todoService.updateStatus(todo.id, 'resolved', profile.uid);
            toast.success('Tarefas atualizada!');
            // Reload specific list or all
            const updatedTodos = await todoService.getByClientId(client.id, { uid: profile.uid, role: profile.role });
            setTodos(updatedTodos);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar tarefa');
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <div className="bg-yellow-100 p-4 rounded-full mb-4">
                    <ShieldAlert className="w-12 h-12 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Pendente</h2>
                <p className="text-gray-500 max-w-md">
                    Seu usuário foi criado com sucesso, mas ainda não identificamos um cadastro de Empresa/Cliente vinculado ao seu perfil.
                </p>
                <p className="text-gray-500 max-w-md mt-2">
                    Por favor, entre em contato com o suporte ou seu gestor para realizar a vinculação.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Painel</h1>
                <p className="text-gray-500">Bem-vindo, {profile?.name}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-primary-900">{client.name}</h2>
                    <p className="text-sm text-gray-500">Empresa Vinculada</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {client.active ? 'Situação Regular' : 'Situação Irregular'}
                </span>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider">Profissionais Atendendo</h3>
                            <div className="mt-4 flex items-center">
                                <span className="text-3xl font-bold text-gray-900">{client.assignedProfessionalIds?.length || 0}</span>
                            </div>
                        </div>
                        {/* More Widgets can go here */}
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Minhas Pendências</h3>
                        <TodoList
                            todos={todos}
                            onResolve={handleResolveTodo}
                        />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Meus Documentos</h3>
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
                            readOnly={true}
                        />
                    </div>
                )}
            </div>

            {client && (
                <UploadModal
                    open={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    client={client}
                    onSuccess={() => loadData()}
                />
            )}
        </div>
    );
}
