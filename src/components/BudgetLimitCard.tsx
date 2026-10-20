import React from 'react';
import { Target, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { formatCurrency, getBudgetStatusColor } from '../utils/formatters';

interface BudgetLimitCardProps {
  totalExpense: number;
  monthlyLimit: number;
  isHidden: boolean;
}

export const BudgetLimitCard: React.FC<BudgetLimitCardProps> = ({
  totalExpense,
  monthlyLimit,
  isHidden,
}) => {
  const percentage = monthlyLimit > 0 ? Math.min(Math.round((totalExpense / monthlyLimit) * 100), 100) : 0;
  const rawPercentage = monthlyLimit > 0 ? Math.round((totalExpense / monthlyLimit) * 100) : 0;
  const statusColor = getBudgetStatusColor(rawPercentage);
  const remaining = Math.max(monthlyLimit - totalExpense, 0);
  const isOverBudget = rawPercentage > 100;

  // Status label
  const statusText = rawPercentage <= 60 ? 'Confortável' : rawPercentage <= 80 ? 'Atenção' : 'Crítico';

  return (
    <div
      id="budget-limit-card"
      className="rounded-2xl bg-zinc-900/75 p-4 sm:p-5 border border-white/[0.07] relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Orçamento do mês
          </h2>
        </div>

        {/* Dynamic Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${statusColor.badgeBg} ${statusColor.border} ${statusColor.text}`}
        >
          {rawPercentage > 100 ? (
            <AlertOctagon className="w-3 h-3" />
          ) : rawPercentage > 80 ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          <span>{statusText} • {rawPercentage}%</span>
        </div>
      </div>

      {/* Two columns: Gasto vs Restante */}
      <div className="grid grid-cols-2 gap-3 mb-3 p-3 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">Já gasto</span>
          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            {formatCurrency(totalExpense, isHidden)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
            {isOverBudget ? 'Excedido em' : 'Ainda pode gastar'}
          </span>
          <span
            className={`text-base sm:text-lg font-bold tracking-tight ${
              isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isOverBudget
              ? formatCurrency(totalExpense - monthlyLimit, isHidden)
              : formatCurrency(remaining, isHidden)}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar with dynamic color */}
      <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden border border-white/5 mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${statusColor.bg} ${statusColor.glow}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Guide captions */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
        <span>0%</span>
        <span>Limite total: {formatCurrency(monthlyLimit, isHidden)}</span>
        <span>100%</span>
      </div>
    </div>
  );
};

