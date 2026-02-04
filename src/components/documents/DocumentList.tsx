import { DocumentFile } from '@/types';
import { FileText, Download, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

interface DocumentListProps {
    documents: DocumentFile[];
    onDelete?: (doc: DocumentFile) => void;
    onStatusChange?: (doc: DocumentFile, status: 'approved' | 'rejected') => void;
    readOnly?: boolean;
}

export function DocumentList({ documents, onDelete, onStatusChange, readOnly = false }: DocumentListProps) {
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'admin';
    const isProfessional = profile?.role === 'professional';
    // Admin and Professional can change status
    const canChangeStatus = !readOnly && (isAdmin || isProfessional);
    const canDelete = !readOnly && isAdmin;

    if (documents.length === 0) {
        return <div className="text-center py-10 text-gray-500">Nenhum documento encontrado.</div>;
    }

    return (
        <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria / Obs</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                        <tr key={doc.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={doc.fileName}>{doc.fileName}</div>
                                        <div className="text-xs text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{doc.category}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]" title={doc.note}>{doc.note}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={doc.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {doc.createdAt ? (doc.createdAt as any).toDate ? format((doc.createdAt as any).toDate(), 'dd/MM/yyyy HH:mm') : '-' : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    <a
                                        href={doc.downloadURL || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-900 p-1"
                                        title="Baixar"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>

                                    {canChangeStatus && (
                                        <>
                                            <button
                                                onClick={() => onStatusChange?.(doc, 'approved')}
                                                className="text-green-600 hover:text-green-900 p-1"
                                                title="Aprovar"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onStatusChange?.(doc, 'rejected')}
                                                className="text-red-500 hover:text-red-900 p-1"
                                                title="Rejeitar"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}

                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete?.(doc)}
                                            className="text-gray-400 hover:text-red-600 p-1"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
