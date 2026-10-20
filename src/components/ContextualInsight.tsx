import React, { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Transaction, UpcomingBill } from '../types';
import { calculateCategoryExpenses, formatCurrency } from '../utils/formatters';

interface ContextualInsightProps {
  transactions: Transaction[];
  monthlyLimit: number;
  upcomingBills: UpcomingBill[];
  isHidden: boolean;
}

export const ContextualInsight: React.FC<ContextualInsightProps> = ({
  transactions,
  monthlyLimit,
  upcomingBills,
  isHidden,
}) => {
  const insight = useMemo(() => {
    const categoryExpenses = calculateCategoryExpenses(transactions);
    const totalExpenses = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);

    // 1. Top expense category insight
    if (categoryExpenses.length > 0 && totalExpenses > 0) {
      const top = categoryExpenses[0];
      const percentOfTotal = Math.round(top.percentage);

      return {
        highlight: top.category.name,
        text: `Sua maior despesa este mês é com `,
        suffix: isHidden
          ? ` (••••••), representando ${percentOfTotal}% dos seus gastos.`
          : ` (${formatCurrency(top.amount)}), representando ${percentOfTotal}% dos seus gastos.`,
        actionText: 'Ver detalhes',
      };
    }

    // 2. Upcoming bills insight fallback
    if (upcomingBills.length > 0) {
      const billsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
      return {
        highlight: `${upcomingBills.length} contas`,
        text: `Você possui `,
        suffix: ` a vencer nos próximos dias somando ${formatCurrency(billsTotal, isHidden)}.`,
        actionText: 'Planejar',
      };
    }

    // 3. General positive insight fallback
    return {
      highlight: 'Orçamento saudável',
      text: 'Seus lançamentos estão dentro do planejado para este mês.',
      suffix: '',
      actionText: null,
    };
  }, [transactions, monthlyLimit, upcomingBills, isHidden]);

  return (
    <div
      id="contextual-insight-card"
      className="rounded-xl bg-gradient-to-r from-indigo-950/30 via-zinc-900/60 to-zinc-900/40 p-3 sm:p-3.5 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <p className="text-zinc-300 leading-relaxed truncate-2-lines">
          <span>{insight.text}</span>
          <strong className="text-white font-semibold">{insight.highlight}</strong>
          <span>{insight.suffix}</span>
        </p>
      </div>

      {insight.actionText && (
        <span className="shrink-0 text-[11px] font-semibold text-indigo-400/90 hidden xs:inline-flex items-center gap-0.5">
          {insight.actionText}
          <ArrowRight className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};
