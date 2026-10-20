import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BellRing,
  Check,
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ParsedBankTransaction, Category, AccountWallet } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { formatCurrency } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';
import { SUPPORTED_BANKS } from '../../services/notificationListener';

interface PendingTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingList: ParsedBankTransaction[];
  categories: Category[];
  accounts?: AccountWallet[];
  onConfirmTransaction: (
    parsed: ParsedBankTransaction,
    selectedCategoryId: string,
    accountName?: string
  ) => void;
  onDiscardTransaction: (id: string, hash: string) => void;
  onDiscardAll: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PendingTransactionsModal: React.FC<PendingTransactionsModalProps> = ({
  isOpen,
  onClose,
  pendingList,
  categories,
  accounts = [],
  onConfirmTransaction,
  onDiscardTransaction,
  onDiscardAll,
  onShowToast,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const currentItem = pendingList[selectedIndex] || pendingList[0];

  useEffect(() => {
    if (currentItem) {
      setSelectedCategoryId(currentItem.suggestedCategoryId || categories[0]?.id || 'outros');
      setEditedDescription(currentItem.description || '');
      // Sugere conta que contenha o nome do banco se houver
      const bankNameLower = (currentItem.bankName || '').toLowerCase();
      const matchingAccount = accounts.find(a =>
        a && typeof a.name === 'string' && bankNameLower && a.name.toLowerCase().includes(bankNameLower)
      );
      setSelectedAccount(matchingAccount ? matchingAccount.name : (accounts[0]?.name || ''));
    }
  }, [currentItem, accounts, categories]);

  if (!isOpen) return null;

  const handleConfirmCurrent = () => {
    if (!currentItem) return;
    triggerHaptic('medium');
    const finalItem: ParsedBankTransaction = {
      ...currentItem,
      description: editedDescription.trim() || currentItem.description,
      suggestedCategoryId: selectedCategoryId,
    };
    onConfirmTransaction(finalItem, selectedCategoryId, selectedAccount || undefined);
    onShowToast('Transação registrada!', `"${finalItem.description}" foi salva com sucesso.`, 'success');

    if (pendingList.length <= 1) {
      onClose();
    } else {
      setSelectedIndex(prev => Math.min(prev, pendingList.length - 2));
    }
  };

  const handleDiscardCurrent = () => {
    if (!currentItem) return;
    triggerHaptic('light');
    onDiscardTransaction(currentItem.id, currentItem.hash);
    onShowToast('Notificação descartada', 'A notificação foi removida da fila.', 'info');

    if (pendingList.length <= 1) {
      onClose();
    } else {
      setSelectedIndex(prev => Math.min(prev, pendingList.length - 2));
    }
  };

  const bankInfo = currentItem ? SUPPORTED_BANKS[currentItem.packageName] : null;
  const bankColor = bankInfo ? bankInfo.color : '#6366F1';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  Despesas Bancárias Detectadas
                  {pendingList.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                      {pendingList.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Revise os lançamentos capturados automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {pendingList.length === 0 || !currentItem ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Check size={36} className="mx-auto text-emerald-400/60" />
                <p className="text-sm font-medium text-slate-200">Tudo limpo!</p>
                <p className="text-xs text-slate-500">
                  Nenhuma notificação bancária pendente de confirmação no momento.
                </p>
              </div>
            ) : (
              <>
                {/* Status da Detecção */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    currentItem.isAmbiguous
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {currentItem.isAmbiguous ? (
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                  ) : (
                    <Sparkles size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                  )}
                  <div className="text-xs">
                    <p className="font-semibold">
                      {currentItem.isAmbiguous
                        ? 'Atenção: Notificação com detalhes parciais'
                        : 'Identificação automática de alta confiança'}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {currentItem.isAmbiguous
                        ? 'Verifique o valor e a categoria sugerida antes de adicionar.'
                        : 'Os dados foram lidos da notificação do seu banco com sucesso.'}
                    </p>
                  </div>
                </div>

                {/* Card de Detalhes da Notificação */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Badge do Banco */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bankColor }}
                      />
                      <span className="text-xs font-semibold text-slate-300">
                        {currentItem.bankName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(currentItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Tipo / Método */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {currentItem.type === 'expense' ? (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <ArrowDownLeft size={14} /> Despesa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <ArrowUpRight size={14} /> Receita
                        </span>
                      )}
                      <span>•</span>
                      <span className="capitalize">{currentItem.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Valor em Destaque */}
                  <div className="text-center py-2 bg-slate-900/70 rounded-xl border border-slate-800/60">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">
                      Valor Detectado
                    </span>
                    <span
                      className={`text-2xl font-bold tracking-tight ${
                        currentItem.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {currentItem.type === 'expense' ? '-' : '+'}
                      {formatCurrency(currentItem.amount)}
                    </span>
                  </div>

                  {/* Campo de Descrição Editável */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Descrição / Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={editedDescription}
                      onChange={e => setEditedDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Ex: Padaria, Uber, etc."
                    />
                  </div>

                  {/* Seletor de Categoria */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Categoria
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {categories
                        .filter(c => c.type === currentItem.type || c.type === 'both')
                        .map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                              selectedCategoryId === cat.id
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-medium'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <CategoryIcon name={cat.icon} size={16} />
                            <span className="truncate">{cat.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Texto Original Sanitizado da Notificação */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <p className="text-[11px] text-slate-500">
                      <strong className="text-slate-400">Texto bruto capturado:</strong>{' '}
                      <span className="italic">"{currentItem.rawText}"</span>
                    </p>
                  </div>
                </div>

                {/* Paginação se houver mais de uma */}
                {pendingList.length > 1 && (
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Item {selectedIndex + 1} de {pendingList.length}
                    </span>
                    <div className="flex gap-1.5">
                      {pendingList.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedIndex(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            i === selectedIndex ? 'bg-indigo-400 w-5' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {currentItem && pendingList.length > 0 && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDiscardCurrent}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20"
              >
                <Trash2 size={15} />
                Descartar
              </button>

              <div className="flex items-center gap-2">
                {pendingList.length > 1 && (
                  <button
                    type="button"
                    onClick={onDiscardAll}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Descartar Todas
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmCurrent}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
                >
                  <Check size={16} />
                  Confirmar e Lançar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
