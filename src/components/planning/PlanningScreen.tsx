import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Target, Plus, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';
import { Category, CategoryBudget, FinancialGoal, Transaction } from '../../types';

import { BudgetSummaryCard } from './BudgetSummaryCard';
import { CategoryBudgetsSection } from './CategoryBudgetsSection';
import { FinancialGoalsSection } from './FinancialGoalsSection';
import { PlanningInsightsSection } from './PlanningInsightsSection';
import { CategoryBudgetModal } from './CategoryBudgetModal';
import { FinancialGoalModal } from './FinancialGoalModal';
import { DeleteGoalModal } from './DeleteGoalModal';

interface PlanningScreenProps {
  categories: Category[];
  transactions: Transaction[];
  monthlyLimit: number;
  categoryBudgets: CategoryBudget[];
  goals: FinancialGoal[];
  isHidden: boolean;
  onUpdateMonthlyLimit: (limit: number) => void;
  onSaveCategoryBudget: (budget: {
    id?: string;
    categoryId: string;
    limit: number;
    spent: number;
    observation?: string;
  }) => void;
  onSaveGoal: (goal: Omit<FinancialGoal, 'id'> & { id?: string }) => void;
  onDeleteGoal: (goalId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const isTransactionInMonth = (txDate: string | undefined, year: number, monthIndex: number): boolean => {
  if (!txDate) return false;
  const match = txDate.match(/^(\d{4})[-/](\d{1,2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    return y === year && m === monthIndex;
  }
  const d = new Date(txDate);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  }
  return false;
};

export const PlanningScreen: React.FC<PlanningScreenProps> = ({
  categories,
  transactions,
  monthlyLimit,
  categoryBudgets,
  goals,
  isHidden,
  onUpdateMonthlyLimit,
  onSaveCategoryBudget,
  onSaveGoal,
  onDeleteGoal,
  onShowToast,
}) => {
  // Navegação dinâmica de meses inicializada em tempo real com a data de hoje (Requisito 1)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  // Active modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryBudget, setSelectedCategoryBudget] = useState<CategoryBudget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  // A badge 'Mês atual' só é exibida quando o mês e ano exibidos forem exatamente iguais aos de hoje (Requisito 2)
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentMonthIndex === today.getMonth() && currentYear === today.getFullYear();
  }, [currentMonthIndex, currentYear]);

  // Calcula o total gasto de despesas especificamente para o mês e ano selecionados (Requisito 3)
  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && isTransactionInMonth(t.date, currentYear, currentMonthIndex))
      .reduce((acc, curr) => acc + (Math.abs(curr.amount) || 0), 0);
  }, [transactions, currentYear, currentMonthIndex]);

  // Sincroniza orçamentos de categoria com o consumo real do mês selecionado
  const categoryBudgetsWithMonthSpent = useMemo(() => {
    return categoryBudgets.map(item => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId === item.categoryId && isTransactionInMonth(t.date, currentYear, currentMonthIndex))
        .reduce((sum, t) => sum + (Math.abs(t.amount) || 0), 0);
      return { ...item, spent };
    });
  }, [categoryBudgets, transactions, currentYear, currentMonthIndex]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonthIndex(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const monthLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;

  return (
    <motion.div
      id="planning-screen"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 pb-28 pt-2"
    >
      {/* 1. Header with Month Navigator */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Planejamento
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Organize seu dinheiro e acompanhe seus objetivos
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Nova Meta</span>
            <span className="sm:hidden">Meta</span>
          </button>
        </div>

        {/* Month Selector Carousel */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-center">
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {monthLabel}
            </span>
            {isCurrentMonth ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Mês atual
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoToCurrentMonth}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 active:scale-95"
                title="Retornar para o mês corrente"
              >
                Ir para hoje
              </button>
            )}
          </div>


          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Budget Summary Card */}
      <BudgetSummaryCard
        totalBudget={monthlyLimit}
        totalSpent={totalSpent}
        monthName={monthLabel}
        isHidden={isHidden}
        onUpdateLimit={onUpdateMonthlyLimit}
        onShowToast={onShowToast}
      />

      {/* 3. Budget by Category */}
      <CategoryBudgetsSection
        categoryBudgets={categoryBudgets}
        categories={categories}
        transactions={transactions}
        currentMonthIndex={currentMonthIndex}
        currentYear={currentYear}
        isHidden={isHidden}
        onAddCategoryBudget={() => {
          setSelectedCategoryBudget(null);
          setIsCategoryModalOpen(true);
        }}
        onEditCategoryBudget={cb => {
          setSelectedCategoryBudget(cb);
          setIsCategoryModalOpen(true);
        }}
      />

      {/* 4. Financial Goals */}
      <FinancialGoalsSection
        goals={goals}
        isHidden={isHidden}
        onAddGoal={() => {
          setSelectedGoal(null);
          setIsGoalModalOpen(true);
        }}
        onEditGoal={goal => {
          setSelectedGoal(goal);
          setIsGoalModalOpen(true);
        }}
        onDeleteGoal={goal => {
          setGoalToDelete(goal);
          setIsDeleteGoalModalOpen(true);
        }}
      />

      {/* 5. Planning Insights */}
      <PlanningInsightsSection
        totalBudget={monthlyLimit}
        totalSpent={totalSpent}
        categoryBudgets={categoryBudgetsWithMonthSpent}
        goals={goals}
        isHidden={isHidden}
      />

      {/* Modal: Category Budget Add/Edit */}
      <CategoryBudgetModal
        isOpen={isCategoryModalOpen}
        categoryBudget={selectedCategoryBudget}
        categories={categories}
        existingCategoryIds={categoryBudgets.map(cb => cb.categoryId)}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategoryBudget(null);
        }}
        onSave={data => {
          onSaveCategoryBudget(data);
          onShowToast(
            selectedCategoryBudget ? 'Limite atualizado' : 'Limite criado',
            `Orçamento para categoria salvo com sucesso.`,
            'success'
          );
        }}
        onShowToast={onShowToast}
      />

      {/* Modal: Financial Goal Add/Edit */}
      <FinancialGoalModal
        isOpen={isGoalModalOpen}
        goalToEdit={selectedGoal}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoal(null);
        }}
        onSave={goalData => {
          onSaveGoal(goalData);
          onShowToast(
            selectedGoal ? 'Meta atualizada' : 'Meta criada',
            `Objetivo "${goalData.name}" salvo com sucesso.`,
            'success'
          );
        }}
        onShowToast={onShowToast}
      />

      {/* Modal: Delete Goal Confirmation */}
      <DeleteGoalModal
        isOpen={isDeleteGoalModalOpen}
        goal={goalToDelete}
        onClose={() => {
          setIsDeleteGoalModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirmDelete={goalId => {
          onDeleteGoal(goalId);
          onShowToast('Meta removida', 'O objetivo financeiro foi excluído.', 'info');
        }}
      />
    </motion.div>
  );
};
