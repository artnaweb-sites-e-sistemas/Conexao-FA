import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { Home } from '@/pages/Home';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthInit } from '@/hooks/useAuthInit';

function App() {
    useAuthInit();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Home />} />
                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/users" element={<div>Gestão de Usuários (Em breve)</div>} />
                        </Route>

                        {/* Admin & Professional Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'professional']} />}>
                            <Route path="/clients" element={<div>Lista de Clientes (Em breve)</div>} />
                        </Route>

                        {/* Client Routes */}
                        <Route path="/documents" element={<div>Meus Documentos (Em breve)</div>} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
