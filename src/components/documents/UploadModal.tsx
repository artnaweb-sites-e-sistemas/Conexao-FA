import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { documentService } from '@/services/documentService';
import { toast } from 'sonner';
import { UploadCloud, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Client } from '@/types';

const CATEGORIES = [
    'Contrato',
    'Documento Pessoal',
    'Comprovante',
    'Relatório',
    'Outros'
];

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client;
    onSuccess: () => void;
}

export function UploadModal({ open, onOpenChange, client, onSuccess }: UploadModalProps) {
    const { profile } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [note, setNote] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !profile) return;

        setUploading(true);
        setProgress(0);

        const metadataPayload = {
            clientId: client.id,
            uploadedByUid: profile.uid,
            uploadedByRole: profile.role,
            category,
            note,
            clientUserId: client.userId,
            assignedProfessionalIds: client.assignedProfessionalIds
        };

        try {
            await documentService.upload(
                file,
                metadataPayload,
                (prog) => setProgress(prog)
            );
            //...
            toast.success('Documento enviado com sucesso!');
            onSuccess();
            onOpenChange(false);
            setFile(null);
            setNote('');
            setProgress(0);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar documento');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar Documento</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!file ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                            />
                            <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Clique ou arraste para enviar</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, Imagens, Office (Max 10MB)</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-100">
                            <div className="flex items-center overflow-hidden">
                                <FileIcon fileName={file.name} />
                                <div className="ml-3 truncate">
                                    <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                                    <p className="text-xs text-blue-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} disabled={uploading} className="p-1 hover:bg-blue-100 rounded-full text-blue-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {file && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    disabled={uploading}
                                >
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observação (Opcional)</label>
                                <input
                                    type="text"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Ex: Assinado na página 2..."
                                    disabled={uploading}
                                />
                            </div>
                        </>
                    )}

                    {uploading && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Enviando...</span>
                                <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={uploading}
                        className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Enviando...' : 'Enviar Arquivo'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FileIcon({ fileName }: { fileName: string }) {
    return <UploadCloud className="w-8 h-8 text-blue-400" />;
}
