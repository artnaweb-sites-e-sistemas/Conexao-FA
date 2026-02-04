import { useEffect, useState } from 'react';
import { clientService } from '@/services/clientService';
import { documentService } from '@/services/documentService';
import { Client, DocumentFile } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { toast, Toaster } from 'sonner';
import { Plus } from 'lucide-react';
import { UploadModal } from '@/components/documents/UploadModal';
import { DocumentList } from '@/components/documents/DocumentList';

export function ClientDocuments() {
    const { profile } = useAuthStore();
    const [client, setClient] = useState<Client | null>(null);
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        if (profile?.uid) {
            loadData();
        }
    }, [profile]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!profile?.uid) return;
            // 1. Get Client ID linked to user
            const clientData = await clientService.getMyClientByUserId(profile.uid);

            if (!clientData) {
                setLoading(false);
                return;
            }
            setClient(clientData);

            // 2. Load Documents
            const docs = await documentService.getByClientId(clientData.id, profile ? { uid: profile.uid, role: profile.role } : undefined);
            setDocuments(docs);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar documentos');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = async () => {
        if (client) {
            const docs = await documentService.getByClientId(client.id, profile ? { uid: profile.uid, role: profile.role } : undefined);
            setDocuments(docs);
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
        return <div className="p-8 text-center text-gray-500">Nenhum vínculo de empresa encontrado.</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
                    <p className="text-gray-500">Gerencie e envie arquivos para sua contabilidade</p>
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Documento
                </button>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <DocumentList
                    documents={documents}
                    readOnly={true} // Clients cannot delete/change status via this list logic (status change disabled)
                />
            </div>

            <UploadModal
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                client={client}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
}
