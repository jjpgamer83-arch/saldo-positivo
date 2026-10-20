import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownLeft, Check, Tag, Building2, Layers, FileText, Calendar, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, TransactionType, Category, CreditCard, AccountWallet } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { CategoryIcon } from './CategoryIcon';
import { getCurrencySymbol } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  initialDate?: string;
  transactionToEdit?: Transaction | null;
  cards?: CreditCard[];
  categories?: Category[];
  accounts?: AccountWallet[];
  onOpenAccounts?: () => void;
  hapticFeedbackEnabled?: boolean;
  onClose: () => void;
  onAddTransaction: (
    transaction: Omit<Transaction, 'id' | 'status'>,
    cardPurchaseData?: {
      cardId: string;
      isInstallment: boolean;
      totalInstallments?: number;
    }
  ) => void;
  onUpdateTransaction?: (updatedTx: Transaction) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const getTodayDate = (): string => {
  return new Date().toLocaleDateString('en-CA');
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  initialDate,
  transactionToEdit = null,
  cards = [],
  categories = INITIAL_CATEGORIES,
  accounts = [],
  onOpenAccounts,
  hapticFeedbackEnabled = true,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  onShowToast,
}) => {
  const isEditing = Boolean(transactionToEdit);
  const currencySymbol = getCurrencySymbol();

  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;

  const accountOptions = useMemo(() => {
    if (accounts && accounts.length > 0) {
      return accounts.map(a => a.name);
    }
    return ['Nubank', 'Itaú', 'Banco Inter', 'Carteira Física', 'Poupança'];
  }, [accounts]);

  // Form State
  const [selectedType, setSelectedType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [account, setAccount] = useState(() => accountOptions[0] || 'Nubank');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [date, setDate] = useState(() => initialDate || getTodayDate());
  const [observation, setObservation] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = () => {
    try {
      if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current?.focus();
      }
    } catch (_) {
      dateInputRef.current?.focus();
    }
  };

  const availableAccounts = ['Nubank', 'Itaú', 'Banco Inter', 'Carteira', 'C6 Bank'];

  const incomeReceivingMethods = [
    { value: 'pix', label: 'Pix' },
    { value: 'transfer', label: 'Transferência bancária' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'salario', label: 'Salário' },
    { value: 'deposito', label: 'Depósito' },
  ];

  const expensePaymentMethods = [
    { value: 'pix', label: 'Pix' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit', label: 'Cartão de Débito' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'boleto', label: 'Boleto bancário' },
    { value: 'transfer', label: 'Transferência' },
  ];

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setSelectedType(transactionToEdit.type);
        setDescription(transactionToEdit.description);
        setAmountStr(transactionToEdit.amount.toString().replace('.', ','));
        setCategoryId(transactionToEdit.categoryId);
        setAccount(transactionToEdit.account || 'Nubank');
        setPaymentMethod(transactionToEdit.paymentMethod || (transactionToEdit.type === 'income' ? 'pix' : 'pix'));
        setSelectedCardId(transactionToEdit.cardId || (cards.length > 0 ? cards[0].id : ''));
        setDate(transactionToEdit.date);
        setObservation(transactionToEdit.observation || '');
        setIsInstallment(false);
      } else {
        setSelectedType(initialType);
        setDescription('');
        setAmountStr('');
        setAccount(accountOptions[0] || 'Nubank');
        setPaymentMethod(initialType === 'income' ? 'pix' : 'pix');
        setIsInstallment(false);
        setInstallmentsCount('2');
        if (cards.length > 0) {
          setSelectedCardId(cards[0].id);
        }
        setDate(initialDate || getTodayDate());
        setObservation('');

        const relevantCategories = activeCategories.filter(
          c => c.type === initialType || c.type === 'both'
        );
        if (relevantCategories.length > 0) {
          setCategoryId(relevantCategories[0].id);
        }
      }
    }
  }, [isOpen, initialType, initialDate, transactionToEdit, cards, activeCategories, accountOptions]);

  const availableCategories = activeCategories.filter(
    c => c.type === selectedType || c.type === 'both'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      onShowToast('Descrição obrigatória', 'Informe uma descrição para a movimentação.', 'warning');
      return;
    }

    // Parse amount
    const normalizedAmount = amountStr.replace(/\./g, '').replace(',', '.');
    const parsedAmount = parseFloat(normalizedAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onShowToast('Valor inválido', 'Insira um valor maior que zero.', 'warning');
      return;
    }

    if (!categoryId) {
      onShowToast('Categoria obrigatória', 'Selecione uma categoria.', 'warning');
      return;
    }

    if (!date) {
      onShowToast('Data obrigatória', 'Selecione uma data válida.', 'warning');
      return;
    }

    if (isEditing && transactionToEdit && onUpdateTransaction) {
      const updated: Transaction = {
        ...transactionToEdit,
        description: description.trim(),
        amount: parsedAmount,
        type: selectedType,
        categoryId,
        account,
        paymentMethod,
        cardId: paymentMethod === 'credit_card' ? selectedCardId : undefined,
        date,
        observation: observation.trim() || undefined,
      };
      onUpdateTransaction(updated);
      triggerHaptic('success', hapticFeedbackEnabled);
      onClose();
      return;
    }

    // Create new transaction
    if (selectedType === 'expense' && paymentMethod === 'credit_card' && selectedCardId) {
      const numInstallments = isInstallment ? Math.max(2, parseInt(installmentsCount, 10) || 2) : 1;
      onAddTransaction(
        {
          description: description.trim(),
          amount: parsedAmount,
          type: selectedType,
          categoryId,
          account: 'Cartão de Crédito',
          paymentMethod: 'credit_card',
          cardId: selectedCardId,
          date,
          observation: observation.trim() || undefined,
        },
        {
          cardId: selectedCardId,
          isInstallment,
          totalInstallments: numInstallments,
        }
      );
    } else {
      onAddTransaction({
        description: description.trim(),
        amount: parsedAmount,
        type: selectedType,
        categoryId,
        account,
        paymentMethod,
        date,
        observation: observation.trim() || undefined,
      });
    }

    triggerHaptic('success', hapticFeedbackEnabled);
    onClose();
  };

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
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEditing ? 'Editar Movimentação' : 'Nova Movimentação'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {isEditing
                    ? 'Altere os dados da movimentação selecionada'
                    : 'Preencha os dados de entrada ou saída'}
                </p>
              </div>
              <button
                id="btn-close-modal"
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector tabs: Receita vs Despesa */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl my-3.5 border border-zinc-800">
              <button
                type="button"
                id="tab-select-income"
                onClick={() => {
                  setSelectedType('income');
                  setPaymentMethod('pix');
                  const relevant = INITIAL_CATEGORIES.filter(c => c.type === 'income');
                  if (relevant.length > 0) setCategoryId(relevant[0].id);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Receita</span>
              </button>

              <button
                type="button"
                id="tab-select-expense"
                onClick={() => {
                  setSelectedType('expense');
                  setPaymentMethod('pix');
                  const relevant = INITIAL_CATEGORIES.filter(c => c.type === 'expense');
                  if (relevant.length > 0) setCategoryId(relevant[0].id);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedType === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Despesa</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Valor Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Valor ({currencySymbol}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    id="input-transaction-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-lg font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                    autoFocus={!isEditing}
                  />
                </div>
              </div>

              {/* Descrição Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição <span className="text-rose-400">*</span>
                </label>
                <input
                  id="input-transaction-description"
                  type="text"
                  placeholder={selectedType === 'income' ? 'Ex: Bônus de Projeto' : 'Ex: Farmácia ou Mercado'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Categoria Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Categoria <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  {availableCategories.map(cat => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 border-white/30 text-white shadow-sm ring-1 ring-white/10'
                            : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat.bgLight,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-medium truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTA (Para Receita ou Despesa) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="select-transaction-account" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Conta ou Carteira</span>
                  </label>
                  {onOpenAccounts && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAccounts();
                      }}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      + Gerenciar contas
                    </button>
                  )}
                </div>
                <select
                  id="select-transaction-account"
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {accountOptions.map(accName => (
                    <option key={accName} value={accName}>
                      {accName}
                    </option>
                  ))}
                </select>
              </div>

              {/* FORMA DE RECEBIMENTO OU PAGAMENTO */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {selectedType === 'income' ? 'Forma de Recebimento' : 'Forma de Pagamento'}
                  </span>
                </label>

                {selectedType === 'income' ? (
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {incomeReceivingMethods.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  >
                    {expensePaymentMethods.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Se for Despesa e selecionou Cartão de Crédito */}
              {selectedType === 'expense' && paymentMethod === 'credit_card' && cards.length > 0 && (
                <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-zinc-950 border border-indigo-500/30">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                      <CardIcon className="w-3.5 h-3.5" />
                      <span>Selecione o Cartão</span>
                    </label>
                    <select
                      value={selectedCardId}
                      onChange={e => setSelectedCardId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      {cards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (•••• {c.lastFourDigits})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Parcelamento toggle */}
                  {!isEditing && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="text-xs text-zinc-300 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInstallment}
                          onChange={e => setIsInstallment(e.target.checked)}
                          className="rounded bg-zinc-900 border-zinc-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span>Compra parcelada</span>
                      </label>

                      {isInstallment && (
                        <select
                          value={installmentsCount}
                          onChange={e => setInstallmentsCount(e.target.value)}
                          className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-indigo-300 font-bold focus:outline-none"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                            <option key={n} value={n}>
                              {n}x parcelas
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Data Input */}
              <div>
                <label
                  htmlFor="input-transaction-date"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5 cursor-pointer select-none"
                  onClick={handleOpenDatePicker}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Data</span> <span className="text-rose-400">*</span>
                </label>
                <div
                  className="relative flex items-center cursor-pointer"
                  onClick={handleOpenDatePicker}
                >
                  <input
                    ref={dateInputRef}
                    id="input-transaction-date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    onClick={e => {
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          e.currentTarget.showPicker();
                        }
                      } catch (_) {}
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none min-h-[46px] cursor-pointer touch-manipulation [color-scheme:dark] transition-colors"
                  />
                </div>
              </div>

              {/* Observação Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Observação (opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais, comprovante, notas..."
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-transaction"
                  type="submit"
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedType === 'income'
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isEditing
                      ? 'Salvar Alterações'
                      : `Salvar ${selectedType === 'income' ? 'Receita' : 'Despesa'}`}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
