import Sidebar from './Sidebar';
import Header from './Header';

export default function PageLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter transition-colors">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}