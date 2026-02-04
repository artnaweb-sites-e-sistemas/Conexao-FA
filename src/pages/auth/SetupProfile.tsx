import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import { userService } from '@/services/userService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function SetupProfile() {
    const { user, setProfile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkExistingProfile = async () => {
            if (!user) return;
            try {
                const userDocSnap = await getDoc(doc(db, 'users', user.uid));
                if (userDocSnap.exists()) {
                    console.log('SetupProfile (Auto): User document already exists. Redirecting...');
                    setProfile({
                        uid: user.uid,
                        ...userDocSnap.data()
                    } as any);
                    navigate('/', { replace: true });
                }
            } catch (err) {
                console.error("Auto-check failed", err);
            } finally {
                setChecking(false);
            }
        };
        checkExistingProfile();
    }, [user, navigate, setProfile]);

    if (!user) {
        navigate('/login');
        return null;
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const handleSetup = async () => {
        setLoading(true);
        try {
            // 0. Safety Check: Does profile already exist?
            try {
                const userDocSnap = await getDoc(doc(db, 'users', user.uid));
                if (userDocSnap.exists()) {
                    console.log('SetupProfile: User document already exists. Redirecting...');
                    setProfile({
                        uid: user.uid,
                        ...userDocSnap.data()
                    } as any);
                    navigate('/');
                    return;
                }
            } catch (err) {
                console.error("Error checking existing profile:", err);
                // Continue to try invite flow just in case
            }

            // DEBUG: Log what email we're using to fetch
            const normalizedEmail = (user.email || '').trim().toLowerCase();
            console.log('=== DEBUG INVITE LOOKUP ===');
            console.log('user.email raw:', user.email);
            console.log('normalizedEmail:', normalizedEmail);
            console.log('Expected doc path: invites/' + normalizedEmail);

            // 1. Check for Pending Invite
            const inviteSnapshot = await userService.getInviteByEmail(user.email || '');
            console.log('inviteSnapshot result:', inviteSnapshot);

            if (!inviteSnapshot) {
                toast.error('Nenhum convite encontrado para este email. Solicite acesso ao administrador.');
                setLoading(false);
                return;
            }

            const userProfile = {
                uid: user.uid,
                email: user.email || '',
                name: inviteSnapshot.name,
                role: inviteSnapshot.role,
                active: true,
                createdAt: serverTimestamp() as any
            };

            // Step 1: Create user profile
            console.log('Step 1: Creating user profile at users/' + user.uid);
            try {
                await setDoc(doc(db, 'users', user.uid), userProfile);
                console.log('Step 1: SUCCESS - User profile created');
            } catch (e) {
                console.error('Step 1: FAILED - Could not create user profile', e);
                throw e;
            }

            // Step 2: Delete invite
            console.log('Step 2: Deleting invite at invites/' + inviteSnapshot.id);
            try {
                await userService.deleteInvite(inviteSnapshot.id);
                console.log('Step 2: SUCCESS - Invite deleted');
            } catch (e) {
                console.error('Step 2: FAILED - Could not delete invite', e);
            }

            setProfile({
                ...userProfile,
                createdAt: new Date().toISOString()
            });

            toast.success('Conta configurada com sucesso!');
            navigate('/');

        } catch (error) {
            console.error('Setup failed:', error);
            toast.error('Erro ao configurar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Finalizar Cadastro
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Valide seu convite para acessar o sistema.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Email autenticado: <strong>{user.email}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSetup}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'Verificar Convite e Entrar'}
                        </button>

                        <button
                            onClick={() => {
                                import('@/lib/firebase').then(({ auth }) => auth.signOut());
                                navigate('/login');
                            }}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
