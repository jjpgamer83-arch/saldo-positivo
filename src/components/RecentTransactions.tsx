import React from 'react';
import { ArrowUpDown, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatTransactionDate, getCategoryById } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isHidden: boolean;
  onViewAll: () => void;
  onOpenAddModal: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  isHidden,
  onViewAll,
  onOpenAddModal,
}) => {
  // Show up to 6 most recent
  const displayed = transactions.slice(0, 6);

  return (
    <div id="section-recent-transactions" className="rounded-2xl bg-zinc-900/80 p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-200">Últimas movimentações</h2>
        </div>
        <button
          id="btn-view-all-transactions"
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-xs text-zinc-400">Você ainda não possui movimentações.</p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Adicionar movimentação
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {displayed.map(tx => {
            const isIncome = tx.type === 'income';
            const category = getCategoryById(tx.categoryId);

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/[0.05] hover:border-white/10 hover:bg-zinc-800/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category icon with type indicator badge */}
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-zinc-900/90"
                      style={{
                        borderColor: `${category.color}35`,
                        color: category.color,
                      }}
                    >
                      <CategoryIcon name={category.icon} className="w-4 h-4" />
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950 text-[10px] ${
                        isIncome ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <ArrowDownLeft className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                      {tx.description}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-zinc-400 font-medium">{category.name}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{formatTransactionDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight block ${
                      isIncome ? 'text-emerald-400' : 'text-zinc-200'
                    }`}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(tx.amount, isHidden)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {isIncome ? 'Receita' : 'Despesa'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
