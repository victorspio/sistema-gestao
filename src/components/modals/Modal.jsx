import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, icon: Icon, children, footer, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2.5 sm:p-4 md:p-6">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full my-auto max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 ${sizeClasses[size] || sizeClasses.md}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {Icon && (
                <div className="p-2 brand-bg-soft brand-text rounded-xl flex-shrink-0">
                  <Icon size={20} />
                </div>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50/70 dark:bg-slate-800/80 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}