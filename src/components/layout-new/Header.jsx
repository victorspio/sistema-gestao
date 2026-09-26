import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ title }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };

  return (
    <header className="h-16 lg:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors sticky top-0 z-30">
      <div className="flex items-center gap-2 pl-12 lg:pl-0 min-w-0 flex-1 mr-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h1>
          {import.meta.env.MODE === 'qa' && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              🧪 QA
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {user && (
          <div className="hidden md:flex items-center gap-2 mr-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            <span className="truncate max-w-[180px]">{user.email}</span>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 lg:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          aria-label="Alternar modo de tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <button
            onClick={handleLogout}
            className="p-2 sm:p-2.5 lg:p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-1.5"
            title="Sair do sistema"
            aria-label="Sair"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-medium">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
}