import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Cpu,
  Package,
  UserCheck,
  ShoppingBag,
  DollarSign,
  BarChart2,
  ShoppingCart,
  Settings,
  Menu,
  X
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useEmpresa } from '../../contexts/EmpresaContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users,           label: 'Clientes', path: '/clientes' },
  { icon: FileText,        label: 'Orçamentos', path: '/orcamentos' },
  { icon: Wrench,          label: 'Ordens de Serviço', path: '/ordens-servico' },
  { icon: ShoppingCart,    label: 'Vendas', path: '/vendas' },
  { icon: Cpu,             label: 'Equipamentos', path: '/equipamentos' },
  { icon: Package,         label: 'Estoque & Produtos', path: '/estoque' },
  { icon: UserCheck,       label: 'Técnicos', path: '/tecnicos' },
  { icon: ShoppingBag,     label: 'Compras', path: '/compras' },
  { icon: DollarSign,      label: 'Financeiro', path: '/financeiro' },
  { icon: BarChart2,       label: 'Relatórios', path: '/relatorios' },
  { icon: Settings,        label: 'Configurações', path: '/configuracoes' },
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { empresa } = useEmpresa();

  const corPrimaria = empresa?.corPrimaria || '#00c8ff';
  const corSidebar = empresa?.corSidebar || '#060d30';
  const nomeEmpresa = empresa?.nome || 'Zeu-Tech';
  const logoSidebar = empresa?.logoSidebar;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3.5 left-3 z-50 p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{ backgroundColor: corSidebar, borderColor: `${corPrimaria}33` }}
        className={`w-72 sm:w-64 h-screen border-r fixed left-0 top-0 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Close Button on Mobile */}
        <div 
          style={{ borderColor: `${corPrimaria}25` }}
          className="p-5 border-b flex items-center justify-between flex-shrink-0"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {logoSidebar ? (
              <div className="h-12 w-auto max-w-[130px] flex items-center justify-center">
                <img
                  src={logoSidebar}
                  alt={nomeEmpresa}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ) : (
              <Logo size="md" />
            )}
            <div className="overflow-hidden">
              <p 
                style={{ color: corPrimaria }}
                className="font-bold tracking-wider uppercase text-xs truncate max-w-[130px]"
                title={nomeEmpresa}
              >
                {nomeEmpresa}
              </p>
              <span className="text-[10px] text-slate-400 block tracking-normal">Sistema de Gestão</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 overscroll-contain">
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                style={isActive ? {
                  backgroundColor: `${corPrimaria}20`,
                  color: corPrimaria,
                  borderLeftColor: corPrimaria,
                  borderLeftWidth: '4px'
                } : {}}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                }`}
                title={label}
              >
                <Icon 
                  size={19} 
                  style={isActive ? { color: corPrimaria } : {}}
                  className={`transition-colors duration-200 flex-shrink-0 ${
                    isActive ? '' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="text-sm truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer - Fixed at bottom */}
        <div 
          style={{ 
            borderColor: `${corPrimaria}25`,
            backgroundColor: `${corSidebar}E6` 
          }}
          className="flex-shrink-0 p-3.5 border-t text-center"
        >
          <span className="text-[11px] text-slate-400 truncate block">
            v1.0.0 &bull; {nomeEmpresa} Gestão
          </span>
        </div>
      </aside>
    </>
  );
}