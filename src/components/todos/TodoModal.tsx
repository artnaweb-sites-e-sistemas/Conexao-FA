import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { todoService } from '@/services/todoService';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Client } from '@/types';

interface TodoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client;
    onSuccess: () => void;
}

export function TodoModal({ open, onOpenChange, client, onSuccess }: TodoModalProps) {
    const { profile } = useAuthStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState<'client' | 'professional'>('client');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title || !profile) return;

        setSubmitting(true);
        try {
            await todoService.create({
                clientId: client.id,
                title,
                description,
                createdByUid: profile.uid,
                createdByRole: profile.role,
                assignedToRole: assignedTo,
                // Denormalized permissions
                clientUserId: client.userId,
                assignedProfessionalIds: client.assignedProfessionalIds
            });

            toast.success('Pendência criada com sucesso!');
            onSuccess();
            onOpenChange(false);
            // Reset
            setTitle('');
            setDescription('');
            setAssignedTo('client');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar pendência');
        } finally {
            setSubmitting(false);
        }
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Pendência</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                        <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Enviar comprovante de pagamento"
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                        <textarea
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalhes adicionais..."
                            disabled={submitting}
                        />
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Atribuir para</label>
                            <select
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value as 'client' | 'professional')}
                                disabled={submitting}
                            >
                                <option value="client">Cliente</option>
                                <option value="professional">Profissional</option>
                            </select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title || submitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                        {submitting ? 'Criando...' : 'Criar Pendência'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
