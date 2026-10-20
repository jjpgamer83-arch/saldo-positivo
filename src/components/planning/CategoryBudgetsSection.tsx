import React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, AlertCircle, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { CategoryBudget, Category, Transaction } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { formatCurrency, getBudgetStatusColor } from '../../utils/formatters';
import { isTransactionInMonth } from './PlanningScreen';

interface CategoryBudgetsSectionProps {
  categoryBudgets: CategoryBudget[];
  categories: Category[];
  transactions: Transaction[];
  currentMonthIndex: number;
  currentYear: number;
  isHidden: boolean;
  onAddCategoryBudget: () => void;
  onEditCategoryBudget: (cb: CategoryBudget) => void;
}

export const CategoryBudgetsSection: React.FC<CategoryBudgetsSectionProps> = ({
  categoryBudgets,
  categories,
  transactions,
  currentMonthIndex,
  currentYear,
  isHidden,
  onAddCategoryBudget,
  onEditCategoryBudget,
}) => {
  return (
    <section id="planning-category-budgets" className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Orçamento por Categoria</h3>
            <span className="text-[11px] text-zinc-400">
              Limites individuais por grupo de despesa
            </span>
          </div>
        </div>

        <button
          id="btn-add-category-budget"
          type="button"
          onClick={onAddCategoryBudget}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Definir Limite</span>
        </button>
      </div>

      {/* Empty State */}
      {categoryBudgets.length === 0 && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center gap-2.5">
          <Layers className="w-8 h-8 text-zinc-600" />
          <div>
            <p className="text-xs font-semibold text-zinc-300">Nenhuma categoria com limite definido</p>
            <p className="text-[11px] text-zinc-500">Defina tetos específicos para alimentação, transporte, moradia e mais.</p>
          </div>
          <button
            type="button"
            onClick={onAddCategoryBudget}
            className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 transition-colors"
          >
            Adicionar primeiro limite
          </button>
        </div>
      )}

      {/* List of Category Budgets */}
      <div className="flex flex-col gap-2.5">
        {categoryBudgets.map(item => {
          const cat = categories.find(c => c.id === item.categoryId);
          
          const spent = transactions
            .filter(t => t.type === 'expense' && t.categoryId === item.categoryId && isTransactionInMonth(t.date, currentYear, currentMonthIndex))
            .reduce((sum, t) => sum + (Math.abs(t.amount) || 0), 0);

          const rawPercentage = item.limit > 0 ? Math.round((spent / item.limit) * 100) : 0;
          const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
          const statusColor = getBudgetStatusColor(rawPercentage);
          const remaining = item.limit - spent;
          const isOver = spent > item.limit;

          return (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.06] transition-all group relative overflow-hidden"
            >
              {/* Category Info & Controls */}
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: cat?.bgLight || 'rgba(255,255,255,0.05)',
                      color: cat?.color || '#10B981',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'Package'} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      {cat?.name || item.categoryId}
                      {isOver && (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                          Excedido
                        </span>
                      )}
                    </h4>
                    {item.observation ? (
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{item.observation}</p>
                    ) : (
                      <span className="text-[11px] text-zinc-500">
                        {rawPercentage}% de {formatCurrency(item.limit, isHidden)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {formatCurrency(spent, isHidden)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      de {formatCurrency(item.limit, isHidden)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditCategoryBudget(item)}
                    className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Editar limite"
                    aria-label={`Editar limite da categoria ${cat?.name || item.categoryId}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${statusColor.bg}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5 font-medium">
                  <span className={statusColor.text}>
                    {rawPercentage}% utilizado
                  </span>
                  <span>
                    {isOver
                      ? `${formatCurrency(Math.abs(remaining), isHidden)} acima do teto`
                      : `${formatCurrency(remaining, isHidden)} restante`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
