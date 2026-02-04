import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { clientService } from '@/services/clientService';
import { UserProfile } from '@/types';
import { toast } from 'sonner';

interface AssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    currentAssignees: string[];
    onSuccess: () => void;
}

export function AssignDialog({ open, onOpenChange, clientId, currentAssignees, onSuccess }: AssignDialogProps) {
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState<UserProfile[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            loadPros();
            setSelected(currentAssignees || []);
        }
    }, [open, currentAssignees]);

    const loadPros = async () => {
        try {
            const users = await userService.getAll();
            setProfessionals(users.filter(u => u.role === 'professional' && u.active));
        } catch (e) {
            toast.error('Erro ao carregar profissionais');
        }
    };

    const toggleSelection = (uid: string) => {
        setSelected(prev =>
            prev.includes(uid)
                ? prev.filter(id => id !== uid)
                : [...prev, uid]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await clientService.assignProfessionals(clientId, selected);
            toast.success('Atribuições atualizadas!');
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            toast.error('Erro ao salvar atribuições');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Atribuir Profissionais</DialogTitle>
                </DialogHeader>

                <div className="max-h-60 overflow-y-auto space-y-2 py-4">
                    {professionals.length === 0 && <p className="text-gray-500 text-sm">Nenhum profissional ativo encontrado.</p>}
                    {professionals.map(pro => (
                        <div key={pro.uid}
                            className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${selected.includes(pro.uid) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                            onClick={() => toggleSelection(pro.uid)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(pro.uid)}
                                readOnly
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{pro.name}</p>
                                <p className="text-xs text-gray-500">{pro.email}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="mr-3 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
