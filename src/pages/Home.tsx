import { useAuthStore } from '@/store/authStore';

export function Home() {
    const { profile } = useAuthStore();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
                Bem-vindo, {profile?.name}
            </h1>
            <p className="mt-1 text-gray-500">
                Painel de controle - {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'professional' ? 'Profissional' : 'Cliente'}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Status do Sistema</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">Operacional</dd>
                    </div>
                </div>
                {/* Add more cards dynamically later */}
            </div>
        </div>
    );
}
