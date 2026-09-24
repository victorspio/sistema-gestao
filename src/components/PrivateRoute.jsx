import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingComponents';

// Tela exibida quando o .env não foi preenchido com as credenciais do Firebase
function FirebaseNotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-orange-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Firebase não configurado
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          O arquivo <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-orange-600 dark:text-orange-400 text-sm">.env</code> está vazio ou incompleto.
          Preencha as credenciais do Firebase para continuar.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-left text-sm font-mono text-slate-700 dark:text-slate-300 space-y-1 border border-slate-200 dark:border-slate-700 mb-6">
          <p className="text-slate-400 dark:text-slate-500 mb-2"># .env (na raiz do projeto)</p>
          <p>VITE_FIREBASE_API_KEY=<span className="text-orange-500">sua_api_key</span></p>
          <p>VITE_FIREBASE_AUTH_DOMAIN=<span className="text-orange-500">seu_projeto.firebaseapp.com</span></p>
          <p>VITE_FIREBASE_PROJECT_ID=<span className="text-orange-500">seu_projeto_id</span></p>
          <p>VITE_FIREBASE_STORAGE_BUCKET=<span className="text-orange-500">seu_projeto.appspot.com</span></p>
          <p>VITE_FIREBASE_MESSAGING_SENDER_ID=<span className="text-orange-500">000000000000</span></p>
          <p>VITE_FIREBASE_APP_ID=<span className="text-orange-500">1:000:web:000</span></p>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Após preencher o .env, reinicie o servidor de desenvolvimento com <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">npm run dev</code>
        </p>
      </div>
    </div>
  );
}

export default function PrivateRoute({ children }) {
  const { user, loading, isConfigured } = useAuth();

  // Firebase não configurado → mostra tela de instrução
  if (!isConfigured) {
    return <FirebaseNotConfigured />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner text="Verificando autenticação..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
