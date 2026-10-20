import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Edit3, DollarSign, X, Check } from 'lucide-react';
import { formatCurrency, getBudgetStatusColor, getCurrencySymbol } from '../../utils/formatters';

interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
  monthName: string;
  isHidden: boolean;
  onUpdateLimit: (newLimit: number) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  totalBudget,
  totalSpent,
  monthName,
  isHidden,
  onUpdateLimit,
  onShowToast,
}) => {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editLimitValue, setEditLimitValue] = useState(totalBudget.toString());

  const available = Math.max(totalBudget - totalSpent, 0);
  const rawPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const progressPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  const statusColor = getBudgetStatusColor(rawPercentage);
  const isOverBudget = rawPercentage > 100;

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(editLimitValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      onShowToast('Valor inválido', 'Informe um teto mensal maior que zero.', 'warning');
      return;
    }
    onUpdateLimit(parsed);
    setIsEditingLimit(false);
    onShowToast('Limite atualizado', `Novo teto mensal definido para ${formatCurrency(parsed)}`, 'success');
  };

  return (
    <div
      id="planning-budget-summary-card"
      className="rounded-3xl bg-zinc-900/80 p-5 sm:p-6 border border-white/[0.08] relative overflow-hidden shadow-xl backdrop-blur-md"
    >
      {/* Background Accent Glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          backgroundColor: isOverBudget ? '#F43F5E' : rawPercentage > 80 ? '#F59E0B' : '#10B981',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Orçamento Geral
            </h2>
            <span className="text-[11px] text-zinc-400 block font-normal">
              Planejamento de {monthName}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusColor.badgeBg} ${statusColor.border} ${statusColor.text}`}
        >
          {isOverBudget ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>{rawPercentage}% consumido</span>
        </div>
      </div>

      {/* Main Numbers: Total, Used & Available */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-white/[0.04] mb-4 relative z-10">
        {/* Teto Definido */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">Teto total</span>
            {!isEditingLimit && (
              <button
                type="button"
                onClick={() => {
                  setEditLimitValue(totalBudget.toString());
                  setIsEditingLimit(true);
                }}
                className="text-zinc-400 hover:text-indigo-400 transition-colors p-0.5"
                title="Editar teto mensal"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatCurrency(totalBudget, isHidden)}
          </span>
        </div>

        {/* Utilizado */}
        <div className="flex flex-col border-l border-zinc-800/80 pl-2 sm:pl-3">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 mb-0.5">Utilizado</span>
          <span
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isOverBudget ? 'text-rose-400' : 'text-zinc-100'
            }`}
          >
            {formatCurrency(totalSpent, isHidden)}
          </span>
        </div>

        {/* Disponível */}
        <div className="flex flex-col border-l border-zinc-800/80 pl-2 sm:pl-3">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 mb-0.5">Disponível</span>
          <span
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isOverBudget ? 'Excedido' : formatCurrency(available, isHidden)}
          </span>
        </div>
      </div>

      {/* Edit Limit Inline Form */}
      <AnimatePresence>
        {isEditingLimit && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveLimit}
            className="mb-4 p-3 bg-zinc-950 border border-indigo-500/30 rounded-2xl flex items-center gap-2 relative z-10"
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold font-mono">
                {getCurrencySymbol()}
              </span>
              <input
                type="text"
                value={editLimitValue}
                onChange={e => setEditLimitValue(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="0,00"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="p-2 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              title="Confirmar"
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingLimit(false)}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
          <span>Progresso de consumo</span>
          <span className={`font-semibold ${statusColor.text}`}>
            {rawPercentage > 100 ? `+${rawPercentage - 100}% acima do teto` : `${100 - rawPercentage}% restante`}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-white/[0.04]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all duration-300 ${statusColor.bg} ${
              rawPercentage > 90 ? 'animate-pulse' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
};
