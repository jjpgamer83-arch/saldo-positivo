import React, { useState } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Transaction } from '../types';
import { calculateCategoryExpenses, formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseChartProps {
  transactions: Transaction[];
  isHidden: boolean;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions, isHidden }) => {
  const categoryExpenses = calculateCategoryExpenses(transactions);
  const totalExpenses = categoryExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // If no expenses exist
  if (categoryExpenses.length === 0 || totalExpenses === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900/60 p-5 border border-white/5 text-center">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Para onde está indo seu dinheiro</h2>
        </div>
        <p className="text-xs text-zinc-500 py-4">Nenhuma despesa registrada neste período.</p>
      </div>
    );
  }

  // Calculate SVG donut slice arcs
  let accumulatedAngle = 0;
  const donutRadius = 40;
  const strokeWidth = 14;
  const center = 50;
  const circumference = 2 * Math.PI * donutRadius;

  return (
    <div id="section-expense-chart" className="rounded-2xl bg-zinc-900/70 p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <PieChartIcon className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-200">Para onde está indo seu dinheiro</h2>
        </div>
        <span className="text-[11px] text-zinc-500 font-medium">
          {categoryExpenses.length} categorias
        </span>
      </div>

      {/* Main Donut + Central Highlight */}
      <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={donutRadius}
              fill="transparent"
              stroke="#1f242e"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {categoryExpenses.map(item => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedAngle;
              accumulatedAngle += (item.percentage / 100) * circumference;

              const isSelected = selectedCategory === item.category.id;

              return (
                <circle
                  key={item.category.id}
                  cx={center}
                  cy={center}
                  r={donutRadius}
                  fill="transparent"
                  stroke={item.category.color}
                  strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  onClick={() =>
                    setSelectedCategory(prev => (prev === item.category.id ? null : item.category.id))
                  }
                />
              );
            })}
          </svg>

          {/* Donut Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              {selectedCategory
                ? categoryExpenses.find(c => c.category.id === selectedCategory)?.category.name
                : 'Total'}
            </span>
            <span className="text-xs font-bold text-white tracking-tight">
              {isHidden
                ? '••••'
                : selectedCategory
                ? formatCurrency(
                    categoryExpenses.find(c => c.category.id === selectedCategory)?.amount || 0
                  )
                : formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Legend / Category breakdown bars */}
        <div className="w-full flex flex-col gap-1.5">
          {categoryExpenses.slice(0, 5).map(item => {
            const isSelected = selectedCategory === item.category.id;

            return (
              <button
                key={item.category.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(prev => (prev === item.category.id ? null : item.category.id))
                }
                className={`w-full text-left p-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800/80 ring-1 ring-white/15'
                    : 'hover:bg-zinc-800/40 bg-zinc-950/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.category.color }}
                    />
                    <span className="font-medium text-zinc-200 truncate">
                      {item.category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-zinc-100">
                      {isHidden ? '••••' : formatCurrency(item.amount)}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400 min-w-8 text-right font-mono">
                      {Math.round(item.percentage)}%
                    </span>
                  </div>
                </div>

                {/* Progress mini-bar */}
                <div className="w-full h-1 rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
