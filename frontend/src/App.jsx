import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import DriversPage from './pages/DriversPage';
import MovementsPage from './pages/MovementsPage';
import ChecklistsPage from './pages/ChecklistsPage';
import FuelingsPage from './pages/FuelingsPage';
import MaintenancesPage from './pages/MaintenancesPage';
import TiresPage from './pages/TiresPage';
import DamagesPage from './pages/DamagesPage';
import MapPage from './pages/MapPage';
import ShiftsPage from './pages/ShiftsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import TvPanelPage from './pages/TvPanelPage';

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-[var(--muted)]">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function Shell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/tv" element={<TvPanelPage />} />
        <Route element={<Shell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/veiculos" element={<VehiclesPage />} />
          <Route path="/veiculos/:id" element={<VehicleDetailPage />} />
          <Route path="/motoristas" element={<DriversPage />} />
          <Route path="/movimentacoes" element={<MovementsPage />} />
          <Route path="/checklists" element={<ChecklistsPage />} />
          <Route path="/abastecimentos" element={<FuelingsPage />} />
          <Route path="/manutencoes" element={<MaintenancesPage />} />
          <Route path="/pneus" element={<TiresPage />} />
          <Route path="/avarias" element={<DamagesPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/turnos" element={<ShiftsPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
