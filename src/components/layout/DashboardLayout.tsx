import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase';
import { LogOut, Home, Users, FileText, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export function DashboardLayout() {
    const { profile } = useAuthStore();
    const location = useLocation();

    const handleLogout = () => auth.signOut();

    if (!profile) return null;

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={clsx(
                    "flex items-center px-4 py-2 rounded-md transition-colors",
                    isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
            >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary-600 tracking-tight">Conexão FA</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        {profile.role === 'admin' ? 'Administrador' : profile.role === 'professional' ? 'Profissional' : 'Cliente'}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem to="/" icon={Home} label="Início" />

                    {(profile.role === 'admin' || profile.role === 'professional') && (
                        <NavItem to="/clients" icon={Users} label="Clientes" />
                    )}

                    {profile.role === 'admin' && (
                        <NavItem to="/users" icon={Users} label="Gestão de Usuários" />
                    )}

                    {profile.role === 'client' && (
                        <>
                            <NavItem to="/documents" icon={FileText} label="Meus Documentos" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center mb-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                            {profile.name[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
