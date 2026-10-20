import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ArrowUpDown, Target, Menu, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { TabType, TransactionType } from '../types';

interface BottomNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddModal: (type: TransactionType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <>
      {/* Quick Action Popup Menu (Adicionar Receita / Adicionar Despesa) */}
      <AnimatePresence>
        {showQuickMenu && (
          <div className="fixed inset-0 z-40 flex items-end justify-center pb-24 px-4 pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowQuickMenu(false)}
            />

            <motion.div
              id="quick-action-menu"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-50 w-full max-w-xs bg-zinc-900/95 border border-zinc-700/60 rounded-2xl p-3 shadow-2xl shadow-black/80 flex flex-col gap-2"
            >
              <div className="text-[11px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                O que deseja adicionar?
              </div>

              <button
                id="btn-quick-add-income"
                type="button"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddModal('income');
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/70 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left cursor-pointer active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Adicionar Receita</span>
                  <span className="text-[11px] text-zinc-400">Salário, freela, transferências</span>
                </div>
              </button>

              <button
                id="btn-quick-add-expense"
                type="button"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddModal('expense');
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/70 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 transition-all text-left cursor-pointer active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Adicionar Despesa</span>
                  <span className="text-[11px] text-zinc-400">Compras, contas, transporte</span>
                </div>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Bar */}
      <nav
        id="bottom-navigation-bar"
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-gradient-to-t from-black via-[#090a0f]/95 to-[#090a0f]/80 backdrop-blur-lg border-t border-white/10 px-2 py-2 safe-bottom"
      >
        <div className="w-full max-w-md flex items-center justify-around relative">
          {/* 1. Início */}
          <button
            id="tab-btn-home"
            type="button"
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'home'
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-none">Início</span>
            {currentTab === 'home' && (
              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
            )}
          </button>

          {/* 2. Movimentações */}
          <button
            id="tab-btn-transactions"
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'transactions'
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpDown className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-none">Movimentações</span>
            {currentTab === 'transactions' && (
              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
            )}
          </button>

          {/* Center Action Button (+) */}
          <div className="relative -top-3">
            <button
              id="btn-main-action-plus"
              type="button"
              onClick={() => setShowQuickMenu(prev => !prev)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 cursor-pointer ${
                showQuickMenu
                  ? 'bg-zinc-800 text-white border border-zinc-600 shadow-black/50'
                  : 'bg-emerald-400 text-black shadow-emerald-500/25 hover:bg-emerald-300'
              }`}
              title="Nova transação"
              aria-label="Adicionar movimentação"
            >
              <div
                className={`transition-transform duration-200 ${
                  showQuickMenu ? 'rotate-45' : 'rotate-0'
                }`}
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
            </button>
          </div>


          {/* 4. Planejamento */}
          <button
            id="tab-btn-planning"
            type="button"
            onClick={() => onSelectTab('planning')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'planning'
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-none">Planejamento</span>
            {currentTab === 'planning' && (
              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
            )}
          </button>

          {/* 5. Mais */}
          <button
            id="tab-btn-more"
            type="button"
            onClick={() => onSelectTab('more')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all ${
              currentTab === 'more'
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-none">Mais</span>
            {currentTab === 'more' && (
              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
