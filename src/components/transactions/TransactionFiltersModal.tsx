import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, RotateCcw, Check, Calendar, DollarSign, Tag, CreditCard as CardIcon, Building2, Layers } from 'lucide-react';
import { Category, CreditCard, TransactionType, PaymentMethod } from '../../types';
import { INITIAL_CATEGORIES } from '../../data/mockData';

export interface TransactionFilterCriteria {
  type: 'all' | TransactionType;
  categoryId: string; // 'all' or id
  account: string; // 'all' or account name
  cardId: string; // 'all' or card id
  paymentMethod: string; // 'all' or payment method
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

export const DEFAULT_FILTERS: TransactionFilterCriteria = {
  type: 'all',
  categoryId: 'all',
  account: 'all',
  cardId: 'all',
  paymentMethod: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
};

interface TransactionFiltersModalProps {
  isOpen: boolean;
  filters: TransactionFilterCriteria;
  categories?: Category[];
  cards?: CreditCard[];
  availableAccounts?: string[];
  onClose: () => void;
  onApply: (newFilters: TransactionFilterCriteria) => void;
  onReset: () => void;
}

export const TransactionFiltersModal: React.FC<TransactionFiltersModalProps> = ({
  isOpen,
  filters,
  categories = INITIAL_CATEGORIES,
  cards = [],
  availableAccounts = ['Nubank', 'Itaú', 'Banco Inter', 'Carteira', 'C6 Bank'],
  onClose,
  onApply,
  onReset,
}) => {
  const [draft, setDraft] = useState<TransactionFilterCriteria>(filters);

  // Sync draft when opened
  React.useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClearAll = () => {
    setDraft(DEFAULT_FILTERS);
    onReset();
    onClose();
  };

  const paymentMethodOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'pix', label: 'Pix' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit', label: 'Cartão de Débito' },
    { value: 'transfer', label: 'Transferência' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'boleto', label: 'Boleto' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Filtros Avançados</h3>
                  <p className="text-[11px] text-zinc-400">Refine a exibição das suas movimentações</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 text-xs">
              {/* 1. Tipo: Todos / Receita / Despesa */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, type: 'all' }))}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      draft.type === 'all'
                        ? 'bg-zinc-800 border-white/30 text-white font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, type: 'income' }))}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      draft.type === 'income'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, type: 'expense' }))}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      draft.type === 'expense'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Despesas
                  </button>
                </div>
              </div>

              {/* 2. Categoria */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Categoria</span>
                </label>
                <select
                  value={draft.categoryId}
                  onChange={e => setDraft(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'income' ? 'Receita' : c.type === 'expense' ? 'Despesa' : 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Conta Bancária */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Conta</span>
                </label>
                <select
                  value={draft.account}
                  onChange={e => setDraft(prev => ({ ...prev, account: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas as contas</option>
                  {availableAccounts.map(acc => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Cartão de Crédito */}
              {cards.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <CardIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cartão de Crédito</span>
                  </label>
                  <select
                    value={draft.cardId}
                    onChange={e => setDraft(prev => ({ ...prev, cardId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Todos os cartões</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (•••• {c.lastFourDigits})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 5. Forma de Pagamento */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Forma de Pagamento</span>
                </label>
                <select
                  value={draft.paymentMethod}
                  onChange={e => setDraft(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {paymentMethodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Período Personalizado */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Período (Data Inicial e Final)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">De:</span>
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={e => setDraft(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Até:</span>
                    <input
                      type="date"
                      value={draft.endDate}
                      onChange={e => setDraft(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Faixa de Valor */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Faixa de Valor (R$)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Mínimo:</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={draft.minAmount}
                      onChange={e => setDraft(prev => ({ ...prev, minAmount: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Máximo:</span>
                    <input
                      type="number"
                      placeholder="Sem limite"
                      value={draft.maxAmount}
                      onChange={e => setDraft(prev => ({ ...prev, maxAmount: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearAll}
                className="py-2.5 px-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Limpar filtros</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aplicar filtros</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
