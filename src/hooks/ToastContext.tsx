import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  error: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300',
  warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300',
  info: 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-300',
};

const ICON_STYLES = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-primary-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map(t => {
            const Icon = ICONS[t.type];
            return (
              <div
                key={t.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in-right",
                  STYLES[t.type]
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 flex-shrink-0 mt-0.5", ICON_STYLES[t.type])} />
                <p className="text-sm flex-1">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
