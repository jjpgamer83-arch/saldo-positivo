import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  isHidden: boolean;
  onOpenAccounts?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  totalIncome,
  totalExpense,
  isHidden,
  onOpenAccounts,
}) => {
  const isPositive = balance >= 0;

  return (
    <motion.div
      id="main-balance-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-[#0c0e14] p-5 border border-emerald-500/20 shadow-xl shadow-black/50"
    >
      {/* Subtle neon-green top accent line & ambient glow */}
      <div className="pointer-events-none absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      <div className="pointer-events-none absolute -top-16 right-0 w-44 h-44 bg-emerald-500/[0.08] rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-0 w-36 h-36 bg-indigo-500/[0.05] rounded-full blur-3xl" />

      {/* Header: Label and discreet month evolution badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onOpenAccounts ? (
            <button
              type="button"
              onClick={onOpenAccounts}
              className="flex items-center gap-2 group cursor-pointer text-left"
              title="Ver contas e carteiras"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-zinc-400 group-hover:text-emerald-300 transition-colors tracking-wide flex items-center gap-1.5">
                Saldo disponível
                <span className="text-[10px] text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  Contas
                </span>
              </span>
            </button>
          ) : (
            <>
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-zinc-400 tracking-wide">
                Saldo disponível
              </span>
            </>
          )}
        </div>

        {/* Discreet evolution indicator */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[11px] font-medium text-emerald-400/90">
          <TrendingUp className="w-3 h-3" />
          <span>+18,4% no mês</span>
        </div>
      </div>

      {/* Dominant Balance Display */}
      <div className="mt-3.5 mb-4">
        <motion.div
          key={isHidden ? 'hidden' : 'visible'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-4xl sm:text-5xl font-extrabold tracking-tight select-none ${
            isPositive ? 'text-white' : 'text-rose-400'
          }`}
        >
          {formatCurrency(balance, isHidden)}
        </motion.div>
      </div>

      {/* Subtle divider */}
      <div className="w-full h-[1px] bg-zinc-800/60 mb-3" />

      {/* Subdued Secondary Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400/90 shrink-0">
            <ArrowUpRight className="w-3 h-3" />
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-[11px] text-zinc-500 font-normal">Entrou:</span>
            <span className="font-semibold text-zinc-200">
              {isHidden ? '••••••' : formatCurrency(totalIncome)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400/90 shrink-0">
            <ArrowDownLeft className="w-3 h-3" />
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-[11px] text-zinc-500 font-normal">Saiu:</span>
            <span className="font-semibold text-zinc-200">
              {isHidden ? '••••••' : formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

