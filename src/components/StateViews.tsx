import React from 'react';
import { AlertCircle, RefreshCw, PlusCircle } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse pt-2">
      {/* Top Balance Card Skeleton */}
      <div className="rounded-2xl bg-zinc-900/60 p-5 border border-zinc-800/60 h-44 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="w-24 h-4 bg-zinc-800 rounded" />
          <div className="w-20 h-5 bg-zinc-800 rounded-full" />
        </div>
        <div className="w-48 h-10 bg-zinc-800 rounded" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="w-full h-8 bg-zinc-800 rounded" />
          <div className="w-full h-8 bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Two summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-900/60 p-4 border border-zinc-800/60 h-24" />
        <div className="rounded-xl bg-zinc-900/60 p-4 border border-zinc-800/60 h-24" />
      </div>

      {/* Chart card skeleton */}
      <div className="rounded-2xl bg-zinc-900/60 p-5 border border-zinc-800/60 h-48 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-4 border-zinc-800" />
      </div>

      {/* Budget card skeleton */}
      <div className="rounded-2xl bg-zinc-900/60 p-5 border border-zinc-800/60 h-28" />

      {/* List skeleton */}
      <div className="rounded-2xl bg-zinc-900/60 p-5 border border-zinc-800/60 h-48 flex flex-col gap-3">
        <div className="w-36 h-4 bg-zinc-800 rounded" />
        <div className="w-full h-10 bg-zinc-800/60 rounded-xl" />
        <div className="w-full h-10 bg-zinc-800/60 rounded-xl" />
      </div>
    </div>
  );
};

interface EmptyStateViewProps {
  onAddTransaction: () => void;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({ onAddTransaction }) => {
  return (
    <div
      id="empty-state-container"
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 my-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
        <PlusCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">
        Você ainda não possui movimentações.
      </h3>
      <p className="text-xs text-zinc-400 max-w-xs mb-5">
        Comece registrando sua primeira receita ou despesa para acompanhar seu saldo e orçamento em tempo real.
      </p>
      <button
        id="btn-empty-add-transaction"
        type="button"
        onClick={onAddTransaction}
        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
      >
        Adicionar movimentação
      </button>
    </div>
  );
};

interface ErrorStateViewProps {
  onRetry: () => void;
  title?: string;
  message?: string;
  commandSnippet?: string;
}

export const ErrorStateView: React.FC<ErrorStateViewProps> = ({
  onRetry,
  title = 'Não foi possível carregar seus dados.',
  message = 'Ocorreu uma instabilidade momentânea na leitura das informações locais.',
  commandSnippet,
}) => {
  return (
    <div
      id="error-state-container"
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-rose-500/5 border border-rose-500/20 my-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-zinc-400 max-w-xs mb-3">
        {message}
      </p>
      {commandSnippet && (
        <code className="text-[11px] font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-white/10 text-emerald-400 mb-5 select-all">
          {commandSnippet}
        </code>
      )}
      <button
        id="btn-error-retry"
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition-all active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Tentar novamente</span>
      </button>
    </div>
  );
};
