import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import OrcamentosPage from './pages/orcamentos';
import OrdensServicoPage from './pages/ordens-servico';
import EquipamentosPage from './pages/equipamentos';
import TecnicosPage from './pages/tecnicos';
import ClientesPage from './pages/clientes';
import EstoquePage from './pages/estoque';
import ComprasPage from './pages/compras';
import FinanceiroPage from './pages/financeiro';
import RelatoriosPage from './pages/relatorios';
import VendasPage from './pages/vendas';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/orcamentos" element={<PrivateRoute><OrcamentosPage /></PrivateRoute>} />
          <Route path="/ordens-servico" element={<PrivateRoute><OrdensServicoPage /></PrivateRoute>} />
          <Route path="/equipamentos" element={<PrivateRoute><EquipamentosPage /></PrivateRoute>} />
          <Route path="/tecnicos" element={<PrivateRoute><TecnicosPage /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
          <Route path="/estoque" element={<PrivateRoute><EstoquePage /></PrivateRoute>} />
          <Route path="/compras" element={<PrivateRoute><ComprasPage /></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute><FinanceiroPage /></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><RelatoriosPage /></PrivateRoute>} />
          <Route path="/vendas" element={<PrivateRoute><VendasPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
