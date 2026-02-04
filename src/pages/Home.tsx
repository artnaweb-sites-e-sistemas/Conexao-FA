import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { clientService } from '@/services/clientService';
import { documentService } from '@/services/documentService';
import { todoService } from '@/services/todoService';
import { userService } from '@/services/userService';
import { DocumentFile, Todo } from '@/types';
import { FileText, CheckSquare, Users, Building2, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function Home() {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        clientsCount: 0,
        profCount: 0,
        pendingDocsCount: 0,
        recentDocs: [] as DocumentFile[],
        recentTodos: [] as Todo[]
    });

    useEffect(() => {
        if (!profile) return;

        // Redirect Client
        if (profile.role === 'client') {
            navigate('/client/home');
            return;
        }

        loadData();
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (profile?.role === 'admin') {
                const [clients, users, docs, todos] = await Promise.all([
                    clientService.getAll(),
                    userService.getAll(),
                    documentService.getRecent(5),
                    todoService.getRecentOpen(5)
                ]);

                // Filter active pros
                const pros = users.filter(u => u.role === 'professional' && u.active).length;
                const activeClients = clients.filter(c => c.active).length;

                setStats({
                    clientsCount: activeClients,
                    profCount: pros,
                    pendingDocsCount: 0,
                    recentDocs: docs,
                    recentTodos: todos
                });

            } else if (profile?.role === 'professional') {
                const clients = await clientService.getMyClients(profile.uid);

                // Parallel fetch
                const [docs, todos, pendingDocs] = await Promise.all([
                    documentService.getRecent(5, { uid: profile.uid, role: 'professional' }),
                    todoService.getRecentOpen(5, { uid: profile.uid, role: 'professional' }),
                    documentService.getPendingCount({ uid: profile.uid, role: 'professional' })
                ]);

                setStats({
                    clientsCount: clients.length,
                    profCount: 0,
                    pendingDocsCount: pendingDocs,
                    recentDocs: docs,
                    recentTodos: todos
                });
            }
        } catch (error) {
            console.error(error);
            // Silent error mostly, or minimal toast
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    // Helper Card Component
    const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-md ${colorClass}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                    <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{value}</div>
                    </dd>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                <p className="text-gray-500">Resumo das atividades recentes</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label={isAdmin ? "Clientes Ativos" : "Meus Clientes"}
                    value={stats.clientsCount}
                    icon={Building2}
                    colorClass="bg-blue-500"
                />

                {isAdmin ? (
                    <StatCard
                        label="Profissionais Ativos"
                        value={stats.profCount}
                        icon={Users}
                        colorClass="bg-indigo-500"
                    />
                ) : (
                    <StatCard
                        label="Docs para Aprovar"
                        value={stats.pendingDocsCount}
                        icon={Clock}
                        colorClass="bg-purple-500"
                    />
                )}

                <StatCard
                    label={stats.recentTodos.length >= 5 ? "Pendências (5+)" : "Pendências Abertas"}
                    value={stats.recentTodos.length}
                    icon={CheckSquare}
                    colorClass="bg-amber-500"
                />
            </div>

            {/* Content Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Documents */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-gray-400" />
                            Documentos Recentes
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {stats.recentDocs.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500 text-center">Nenhum documento recente</li>
                        ) : (
                            stats.recentDocs.map(doc => (
                                <li key={doc.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-primary-600 truncate max-w-[200px]">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(doc.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                                                {' - '}
                                                {doc.status === 'pending' ? 'Pendente' : doc.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate(isAdmin ? `/clients/${doc.clientId}` : `/professional/clients/${doc.clientId}`)}
                                            className="text-gray-400 hover:text-primary-600"
                                            title="Ir para Cliente"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Pending Todos */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <CheckSquare className="w-5 h-5 mr-2 text-gray-400" />
                            Pendências Abertas (Recentes)
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {stats.recentTodos.length === 0 ? (
                            <li className="px-4 py-4 text-sm text-gray-500 text-center">Nenhuma pendência aberta</li>
                        ) : (
                            stats.recentTodos.map(todo => (
                                <li key={todo.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{todo.title}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(todo.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate(isAdmin ? `/clients/${todo.clientId}` : `/professional/clients/${todo.clientId}`)}
                                            className="text-gray-400 hover:text-primary-600"
                                            title="Ir para Cliente"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {!isAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={() => navigate('/professional/clients')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                    >
                        Ver todos os meus clientes
                        <ArrowRight className="ml-2 -mr-1 w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
