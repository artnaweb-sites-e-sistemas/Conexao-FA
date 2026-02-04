import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const { user, profile, loading: authLoading } = useAuthStore();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && user) {
            if (profile) {
                // User has profile, go to dashboard
                navigate('/', { replace: true });
            } else {
                // User logged in but no profile, go to setup
                navigate('/setup', { replace: true });
            }
        }
    }, [user, profile, authLoading, navigate]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        try {
            if (isRegistering) {
                // Register - new user, always goes to setup
                await import('firebase/auth').then(({ createUserWithEmailAndPassword }) =>
                    createUserWithEmailAndPassword(auth, data.email, data.password)
                );
                toast.success('Conta criada! Verificando convite...');
                navigate('/setup');
            } else {
                // Login - existing user
                await signInWithEmailAndPassword(auth, data.email, data.password);
                // Don't navigate here! Let useAuthInit load the profile first,
                // then ProtectedRoute will handle the routing.
                // The Login page should redirect authenticated users automatically.
                toast.success('Login realizado!');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.code === 'auth/email-already-in-use'
                ? 'Email já cadastrado.'
                : error.code === 'auth/invalid-credential'
                    ? 'Credenciais inválidas.'
                    : 'Ocorreu um erro. Tente novamente.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Toaster position="top-right" />
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isRegistering ? 'Criar nova conta' : 'Entrar na sua conta'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Conexão FA
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {isRegistering ? 'Já tem uma conta?' : 'Novo por aqui?'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                {isRegistering ? 'Fazer Login' : 'Criar Conta'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
