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
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
      <aside className={`w-72 sm:w-64 h-screen bg-[#060d30] border-r border-[#00c8ff]/20 fixed left-0 top-0 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo and Close Button on Mobile */}
        <div className="p-5 border-b border-[#00c8ff]/20 flex items-center justify-between flex-shrink-0">
          <div>
            <Logo size="md" />
            <p className="font-bold text-[#00c8ff] mt-1 tracking-wider uppercase text-[11px]">
              Zeu-Tech
            </p>
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
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00c8ff]/15 text-[#00c8ff] border-l-4 border-[#00c8ff] shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                }`}
                title={label}
              >
                <Icon 
                  size={20} 
                  className={`transition-colors duration-200 flex-shrink-0 ${
                    isActive ? 'text-[#00c8ff]' : 'text-slate-400 group-hover:text-[#00c8ff]'
                  }`}
                />
                <span className="text-sm truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 p-3.5 border-t border-[#00c8ff]/20 bg-[#060d30]/90 text-center">
          <span className="text-[11px] text-slate-500">v1.0.0 &bull; Zeu-Tech Gestão</span>
        </div>
      </aside>
    </>
  );
}