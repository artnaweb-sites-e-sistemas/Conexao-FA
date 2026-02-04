import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfile } from '@/types';
import { useState } from 'react';
import { userService } from '@/services/userService';
import { useEffect } from 'react';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    userId: z.string().optional(),
    active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: FormData) => Promise<void>;
    initialData?: FormData | null;
}

export function ClientDialog({ open, onOpenChange, onSubmit, initialData }: ClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { active: true }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset(initialData);
            } else {
                reset({ active: true, name: '', userId: '' });
            }
            loadUsers();
        }
    }, [open, initialData, reset]);

    const loadUsers = async () => {
        try {
            const users = await userService.getAll();
            // Filter only clients. In real app, maybe do this on backend or specialized query
            setAvailableUsers(users.filter(u => u.role === 'client' && u.active));
        } catch (e) {
            console.error(e);
            toast.error('Erro ao carregar usuários');
        }
    };

    const handleFormSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Cliente / Empresa</label>
                        <input
                            {...register('name')}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                            placeholder="Ex: Clinica X"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vincular Usuário (Login)</label>
                        <select
                            {...register('userId')}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                            <option value="">-- Sem vínculo --</option>
                            {availableUsers.map(u => (
                                <option key={u.uid} value={u.uid}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Selecione um usuário com perfil 'Cliente' para dar acesso a este painel.</p>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="active"
                            type="checkbox"
                            {...register('active')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                            Cliente Ativo
                        </label>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
