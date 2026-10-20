import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CategoryBudget, FinancialGoal, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PlanningInsightsSectionProps {
  totalBudget: number;
  totalSpent: number;
  categoryBudgets: CategoryBudget[];
  goals: FinancialGoal[];
  isHidden: boolean;
}

export const PlanningInsightsSection: React.FC<PlanningInsightsSectionProps> = ({
  totalBudget,
  totalSpent,
  categoryBudgets,
  goals,
  isHidden,
}) => {
  const insights: Array<{
    id: string;
    type: 'warning' | 'positive' | 'tip';
    title: string;
    description: string;
    icon: any;
    color: string;
  }> = [];

  // Check overall budget consumption
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  if (budgetUsage > 100) {
    insights.push({
      id: 'ins-overbudget',
      type: 'warning',
      title: 'Teto mensal ultrapassado',
      description: `Seus gastos superaram o orçamento em ${formatCurrency(totalSpent - totalBudget, isHidden)}. Reduza gastos variáveis para equilibrar o mês.`,
      icon: AlertTriangle,
      color: '#F43F5E',
    });
  } else if (budgetUsage <= 70) {
    insights.push({
      id: 'ins-good-pace',
      type: 'positive',
      title: 'Ritmo financeiro saudável',
      description: `Você consumiu apenas ${Math.round(budgetUsage)}% do teto mensal planejado, restando ${formatCurrency(totalBudget - totalSpent, isHidden)} para o período.`,
      icon: ShieldCheck,
      color: '#10B981',
    });
  }

  // Check category closest to or exceeding limit
  const criticalCategories = categoryBudgets.filter(cb => (cb.spent / cb.limit) >= 0.85);
  if (criticalCategories.length > 0) {
    const worst = criticalCategories.reduce((prev, curr) => (curr.spent / curr.limit) > (prev.spent / prev.limit) ? curr : prev);
    const catPercent = Math.round((worst.spent / worst.limit) * 100);
    insights.push({
      id: 'ins-cat-alert',
      type: 'warning',
      title: `Atenção em ${worst.categoryId}`,
      description: `Esta categoria atingiu ${catPercent}% do limite estipulado (${formatCurrency(worst.spent, isHidden)} de ${formatCurrency(worst.limit, isHidden)}).`,
      icon: AlertTriangle,
      color: '#F59E0B',
    });
  }

  // Goal insight
  const incompleteGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  if (incompleteGoals.length > 0) {
    const closest = incompleteGoals.reduce((prev, curr) => (curr.currentAmount / curr.targetAmount) > (prev.currentAmount / prev.targetAmount) ? curr : prev);
    const percent = Math.round((closest.currentAmount / closest.targetAmount) * 100);
    insights.push({
      id: 'ins-goal-progress',
      type: 'tip',
      title: `Meta "${closest.name}" próxima!`,
      description: `Você já completou ${percent}% do seu objetivo. Faltam apenas ${formatCurrency(closest.targetAmount - closest.currentAmount, isHidden)} até ${closest.deadline}.`,
      icon: TrendingUp,
      color: '#6366F1',
    });
  }

  // Savings suggestion
  insights.push({
    id: 'ins-saving-rule',
    type: 'tip',
    title: 'Regra 50-30-20 recomendada',
    description: 'Procure direcionar 50% para necessidades básicas, 30% para estilo de vida e 20% para suas metas e reserva de emergência.',
    icon: Lightbulb,
    color: '#06B6D4',
  });

  return (
    <section id="planning-insights-section" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Insights do Planejamento</h3>
          <span className="text-[11px] text-zinc-400">
            Diagnósticos calculados com base no seu padrão
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {insights.slice(0, 3).map(insight => {
          const IconComp = insight.icon;
          return (
            <div
              key={insight.id}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.05] flex items-start gap-3 hover:bg-zinc-900/80 transition-all"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${insight.color}15`,
                  color: insight.color,
                  border: `1px solid ${insight.color}30`,
                }}
              >
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white mb-0.5">{insight.title}</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
