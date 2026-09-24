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
  Menu,
  X
} from 'lucide-react';
import Logo from '../ui/Logo';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users,           label: 'Clientes', path: '/clientes' },
  { icon: FileText,        label: 'Orçamentos', path: '/orcamentos' },
  { icon: Wrench,          label: 'Ordens de Serviço', path: '/ordens-servico' },
  { icon: Cpu,             label: 'Equipamentos', path: '/equipamentos' },
  { icon: Package,         label: 'Estoque & Produtos', path: '/estoque' },
  { icon: UserCheck,       label: 'Técnicos', path: '/tecnicos' },
  { icon: ShoppingBag,     label: 'Compras', path: '/compras' },
  { icon: DollarSign,      label: 'Financeiro', path: '/financeiro' },
  { icon: BarChart2,       label: 'Relatórios', path: '/relatorios' },
  { icon: ShoppingCart,    label: 'Vendas Balcão', path: '/vendas' },
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} className="text-slate-700 dark:text-slate-300" /> : <Menu size={24} className="text-slate-700 dark:text-slate-300" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 h-screen bg-[#060d30] border-r border-[#00c8ff]/20 fixed left-0 top-0 shadow-lg transition-all duration-300 z-40 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="p-6 border-b border-[#00c8ff]/20 flex-shrink-0">
        <Logo size="md" />
        <p className="text-sm font-bold text-[#00c8ff] mt-2 tracking-wide uppercase text-xs">
          Zeu-Tech
        </p>
      </div>
      {/* Menu - Scrollable */}
      <nav className="flex-1 overflow-y-auto mt-6 px-4 pb-20">
        <div className="space-y-2">
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00c8ff]/10 text-[#00c8ff] border-l-4 border-[#00c8ff] shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title={label}
              >
                <Icon 
                  size={20} 
                   className={`transition-colors duration-200 ${
                    isActive ? 'text-[#00c8ff]' : 'text-slate-400 group-hover:text-[#00c8ff]'
                  }`}
                />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-[#00c8ff]/20 bg-[#060d30]">
        <div className="text-xs text-slate-500 text-center">
          v1.0.0
        </div>
      </div>
    </aside>
    </>
  );
}