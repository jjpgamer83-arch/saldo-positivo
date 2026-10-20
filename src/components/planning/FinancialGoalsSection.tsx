import React from 'react';
import { motion } from 'motion/react';
import { Target, Plus, Calendar, Edit2, Trash2, ShieldCheck, Plane, Laptop, Home, Car, CheckCircle2, Award } from 'lucide-react';
import { FinancialGoal } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface FinancialGoalsSectionProps {
  goals: FinancialGoal[];
  isHidden: boolean;
  onAddGoal: () => void;
  onEditGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goal: FinancialGoal) => void;
}

export const FinancialGoalsSection: React.FC<FinancialGoalsSectionProps> = ({
  goals,
  isHidden,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  const renderGoalIcon = (iconName?: string, color?: string) => {
    const defaultColor = color || '#10B981';
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" style={{ color: defaultColor }} />;
      case 'Plane':
        return <Plane className="w-5 h-5" style={{ color: defaultColor }} />;
      case 'Laptop':
        return <Laptop className="w-5 h-5" style={{ color: defaultColor }} />;
      case 'Home':
        return <Home className="w-5 h-5" style={{ color: defaultColor }} />;
      case 'Car':
        return <Car className="w-5 h-5" style={{ color: defaultColor }} />;
      default:
        return <Target className="w-5 h-5" style={{ color: defaultColor }} />;
    }
  };

  return (
    <section id="planning-financial-goals" className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Objetivos Financeiros</h3>
            <span className="text-[11px] text-zinc-400">
              Metas e planos de médio e longo prazo
            </span>
          </div>
        </div>

        <button
          id="btn-add-financial-goal"
          type="button"
          onClick={onAddGoal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center gap-2.5">
          <Target className="w-8 h-8 text-zinc-600" />
          <div>
            <p className="text-xs font-semibold text-zinc-300">Nenhuma meta cadastrada</p>
            <p className="text-[11px] text-zinc-500">Crie objetivos para guardar dinheiro e acompanhar sua evolução.</p>
          </div>
          <button
            type="button"
            onClick={onAddGoal}
            className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-colors"
          >
            Cadastrar primeiro objetivo
          </button>
        </div>
      )}

      {/* Goals Cards */}
      <div className="grid grid-cols-1 gap-3">
        {goals.map(goal => {
          const rawPercentage = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
          const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

          return (
            <div
              key={goal.id}
              className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.06] transition-all relative overflow-hidden group"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${goal.color || '#10B981'}15`,
                      borderColor: `${goal.color || '#10B981'}30`,
                      borderWidth: 1,
                    }}
                  >
                    {renderGoalIcon(goal.icon, goal.color)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{goal.name}</h4>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Concluído!
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1 font-medium">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>Prazo: {goal.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditGoal(goal)}
                    className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Editar meta"
                    aria-label={`Editar ${goal.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal)}
                    className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Excluir meta"
                    aria-label={`Excluir ${goal.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and Amount */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">Acumulado</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {formatCurrency(goal.currentAmount, isHidden)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block font-medium">Objetivo</span>
                    <span className="text-sm font-bold text-zinc-300 tracking-tight">
                      {formatCurrency(goal.targetAmount, isHidden)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color || '#10B981' }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5 font-medium">
                  <span style={{ color: goal.color || '#10B981' }} className="font-semibold">
                    {rawPercentage}% alcançado
                  </span>
                  <span>
                    {isCompleted
                      ? 'Meta atingida!'
                      : `Faltam ${formatCurrency(remainingAmount, isHidden)}`}
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
