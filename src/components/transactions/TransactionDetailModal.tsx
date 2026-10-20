import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownLeft, Calendar, Tag, Building2, Layers, FileText, Edit2, Trash2, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, CreditCard } from '../../types';
import { formatCurrency, formatDate, getCategoryById } from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  cards?: CreditCard[];
  isHidden?: boolean;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDeleteRequest: (transaction: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  cards = [],
  isHidden = false,
  onClose,
  onEdit,
  onDeleteRequest,
}) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const category = getCategoryById(transaction.categoryId);
  const card = transaction.cardId ? cards.find(c => c.id === transaction.cardId) : null;

  const paymentMethodLabels: Record<string, string> = {
    pix: 'Pix',
    credit_card: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    cash: 'Dinheiro',
    transfer: 'Transferência Bancária (TED/DOC)',
    boleto: 'Boleto Bancário',
  };

  const paymentMethodDisplay = transaction.paymentMethod
    ? paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod
    : 'Conta Corrente';

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

          {/* Modal Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    isIncome
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                  <span>{isIncome ? 'Receita' : 'Despesa'}</span>
                </span>
                <span className="text-xs text-zinc-500">#{transaction.id}</span>
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

            {/* Value & Title Highlight */}
            <div className="py-2 text-center flex flex-col items-center">
              <span className="text-xs text-zinc-400 mb-1">Valor da movimentação</span>
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isIncome ? '+ ' : '- '}
                {formatCurrency(transaction.amount, isHidden)}
              </h2>
              <h3 className="text-sm font-semibold text-zinc-200 mt-1 max-w-xs truncate">
                {transaction.description}
              </h3>
            </div>

            {/* Details Grid */}
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-3.5 flex flex-col gap-3">
              {/* Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Tag className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Categoria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: category.bgLight, color: category.color }}
                  >
                    <CategoryIcon name={category.icon} className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">{category.name}</span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Data</span>
                </div>
                <span className="text-xs font-semibold text-zinc-200 font-mono">
                  {formatDate(transaction.date)}
                </span>
              </div>

              {/* Conta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Conta</span>
                </div>
                <span className="text-xs font-semibold text-zinc-200">
                  {transaction.account || 'Conta Principal'}
                </span>
              </div>

              {/* Forma de Pagamento / Recebimento */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{isIncome ? 'Forma de Recebimento' : 'Forma de Pagamento'}</span>
                </div>
                <span className="text-xs font-semibold text-zinc-200">
                  {paymentMethodDisplay}
                </span>
              </div>

              {/* Cartão se houver */}
              {card && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CardIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cartão Utilizado</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-300">
                    {card.name} (•••• {card.lastFourDigits})
                  </span>
                </div>
              )}

              {/* Observação se houver */}
              {transaction.observation && (
                <div className="pt-2 border-t border-zinc-800/60 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Observação</span>
                  </div>
                  <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                    {transaction.observation}
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Editar e Excluir */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(transaction);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(transaction);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Movimentação</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
