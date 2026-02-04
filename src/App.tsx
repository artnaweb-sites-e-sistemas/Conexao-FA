import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import { Home } from '@/pages/Home';
import { SetupProfile } from '@/pages/auth/SetupProfile';
import { Users } from '@/pages/admin/Users';
import { Clients } from '@/pages/admin/Clients';
import { ClientDetails } from '@/pages/professional/ClientDetails';
import { ClientHome } from '@/pages/client/ClientHome';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthInit } from '@/hooks/useAuthInit';

function App() {
    useAuthInit();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/setup" element={<SetupProfile />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Home />} />

                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/users" element={<Users />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/clients/:id" element={<ClientDetails />} />
                        </Route>

                        {/* Professional Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['professional']} />}>
                            <Route path="/professional/clients" element={<Clients />} />
                            <Route path="/professional/clients/:id" element={<ClientDetails />} />
                        </Route>

                        {/* Client Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                            <Route path="/client/home" element={<ClientHome />} />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
