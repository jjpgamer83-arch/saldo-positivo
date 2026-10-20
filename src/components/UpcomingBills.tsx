import React from 'react';
import { CalendarClock, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { UpcomingBill } from '../types';
import { formatCurrency, getCategoryById } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface UpcomingBillsProps {

  bills: UpcomingBill[];
  isHidden: boolean;
  onViewAll: () => void;
}

export const UpcomingBills: React.FC<UpcomingBillsProps> = ({ bills, isHidden, onViewAll }) => {
  return (
    <div id="section-upcoming-bills" className="rounded-2xl bg-zinc-900/80 p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-200">Próximas contas</h2>
        </div>
        <button
          id="btn-view-all-bills"
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bills List */}
      <div className="flex flex-col gap-2">
        {bills.length === 0 ? (
          <div className="py-5 px-3 rounded-xl bg-zinc-950/30 border border-white/[0.04] text-center flex flex-col items-center justify-center">
            <span className="text-xs text-zinc-400 font-medium">Nenhuma conta pendente para este mês.</span>
          </div>
        ) : (
          bills.map(bill => {
            const category = getCategoryById(bill.categoryId);
            const isPending = bill.status === 'pending';

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/[0.05] hover:border-white/10 hover:bg-zinc-800/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: category.bgLight,
                    borderColor: `${category.color}25`,
                    color: category.color,
                  }}
                >
                  <CategoryIcon name={category.icon} className="w-4 h-4" />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                    {bill.name}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>
                      Vence dia {bill.dueDay} de{' '}
                      {bill.dueDate && bill.dueDate.split('-').length >= 2
                        ? MONTH_NAMES[parseInt(bill.dueDate.split('-')[1], 10) - 1] || MONTH_NAMES[new Date().getMonth()]
                        : MONTH_NAMES[new Date().getMonth()]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  {formatCurrency(bill.amount, isHidden)}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      isPending ? 'text-amber-400/90' : 'text-emerald-400/90'
                    }`}
                  >
                    {isPending ? 'Pendente' : 'Pago'}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};
