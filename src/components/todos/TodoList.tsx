import { Todo } from '@/types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TodoListProps {
    todos: Todo[];
    onResolve: (todo: Todo) => void;
    readOnly?: boolean;
}

export function TodoList({ todos, onResolve, readOnly = false }: TodoListProps) {
    if (todos.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma pendência</h3>
                <p className="mt-1 text-sm text-gray-500">Tudo em dia por aqui!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {todos.map((todo) => {
                const isResolved = todo.status === 'resolved';

                return (
                    <div
                        key={todo.id}
                        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start justify-between transition-opacity ${isResolved ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                        <div className="flex items-start space-x-3">
                            <div className={`mt-1 ${isResolved ? 'text-green-500' : 'text-amber-500'}`}>
                                {isResolved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium ${isResolved ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {todo.title}
                                </h4>
                                {todo.description && (
                                    <p className="text-sm text-gray-500 mt-1">{todo.description}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                                        Para: {todo.assignedToRole === 'client' ? 'Cliente' : 'Profissional'}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(todo.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                                    {todo.resolvedAt && (
                                        <>
                                            <span>•</span>
                                            <span className="text-green-600">Resolvido em {new Date(todo.resolvedAt.toDate()).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!isResolved && !readOnly && (
                            <button
                                onClick={() => onResolve(todo)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-4"
                            >
                                Marcar como resolvida
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
