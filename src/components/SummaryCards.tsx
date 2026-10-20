import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  isHidden: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  isHidden,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* Entradas */}
      <div
        id="summary-card-income"
        className="rounded-xl bg-zinc-900/70 p-3.5 border border-white/[0.06] hover:border-emerald-500/20 transition-all shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-zinc-400">Entradas</span>
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-white tracking-tight">
            {formatCurrency(totalIncome, isHidden)}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-0.5 inline-block">
            +12% vs mês anterior
          </span>
        </div>
      </div>

      {/* Saídas */}
      <div
        id="summary-card-expense"
        className="rounded-xl bg-zinc-900/70 p-3.5 border border-white/[0.06] hover:border-rose-500/20 transition-all shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-zinc-400">Saídas</span>
          <div className="w-5 h-5 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowDownLeft className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-white tracking-tight">
            {formatCurrency(totalExpense, isHidden)}
          </div>
          <span className="text-[10px] text-rose-400/80 font-medium mt-0.5 inline-block">
            Total pago e pendente
          </span>
        </div>
      </div>
    </div>
  );
};

