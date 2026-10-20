import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-container"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map(toast => {
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
          let border = 'border-zinc-700/80';
          let glow = 'shadow-lg shadow-black/40';

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            border = 'border-emerald-500/30';
            glow = 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]';
          } else if (toast.type === 'error') {
            icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            border = 'border-rose-500/30';
            glow = 'shadow-[0_4px_20px_rgba(244,63,94,0.15)]';
          } else if (toast.type === 'warning') {
            icon = <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
            border = 'border-amber-500/30';
            glow = 'shadow-[0_4px_20px_rgba(245,158,11,0.15)]';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-900/95 backdrop-blur-md border ${border} ${glow} text-sm text-zinc-100`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {icon}
                <div className="flex flex-col">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                    {toast.title}
                  </span>
                  {toast.description && (
                    <span className="text-[11px] text-zinc-400 leading-tight">
                      {toast.description}
                    </span>
                  )}
                </div>
              </div>
              <button
                id={`toast-dismiss-${toast.id}`}
                onClick={() => onDismiss(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
