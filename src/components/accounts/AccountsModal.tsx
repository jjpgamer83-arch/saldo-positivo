import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Wallet,
  Building2,
  PiggyBank,
  TrendingUp,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react';
import { AccountWallet, AccountType, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountWallet[];
  transactions: Transaction[];
  isHidden: boolean;
  onSaveAccount: (account: AccountWallet, isNew: boolean, oldName?: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const PRESET_BANKS = [
  { name: 'Nubank', type: 'checking' as AccountType, color: '#820AD1', icon: 'Building2' },
  { name: 'Itaú', type: 'checking' as AccountType, color: '#EC7000', icon: 'Building2' },
  { name: 'Banco Inter', type: 'checking' as AccountType, color: '#FF7A00', icon: 'Building2' },
  { name: 'Banco do Brasil', type: 'checking' as AccountType, color: '#0038A8', icon: 'Building2' },
  { name: 'Bradesco', type: 'checking' as AccountType, color: '#CC092F', icon: 'Building2' },
  { name: 'Santander', type: 'checking' as AccountType, color: '#EA1D2C', icon: 'Building2' },
  { name: 'Caixa', type: 'checking' as AccountType, color: '#005CA9', icon: 'Building2' },
  { name: 'C6 Bank', type: 'checking' as AccountType, color: '#242424', icon: 'Building2' },
  { name: 'Carteira Física', type: 'cash' as AccountType, color: '#10B981', icon: 'Wallet' },
  { name: 'Poupança Caixa', type: 'savings' as AccountType, color: '#2563EB', icon: 'PiggyBank' },
  { name: 'XP Investimentos', type: 'investment' as AccountType, color: '#000000', icon: 'TrendingUp' },
];

const COLOR_PALETTE = [
  '#820AD1', // Nubank Purple
  '#EC7000', // Itaú Orange
  '#FF7A00', // Inter Orange
  '#0038A8', // BB Blue
  '#10B981', // Emerald / Money
  '#2563EB', // Blue / Savings
  '#06B6D4', // Cyan / Investments
  '#EA1D2C', // Santander Red
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#64748B', // Slate
];

export function calculateAccountBalance(account: AccountWallet, transactions: Transaction[]): number {
  const normName = account.name.trim().toLowerCase();
  const normId = account.id.trim().toLowerCase();

  const accountTransactions = transactions.filter(t => {
    if (!t.account) return false;
    const tAcc = t.account.trim().toLowerCase();
    return tAcc === normName || tAcc === normId;
  });

  const income = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return account.initialBalance + income - expense;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  isHidden,
  onSaveAccount,
  onDeleteAccount,
  onShowToast,
}) => {
  // Filter tab
  const [filterType, setFilterType] = useState<string>('all');

  // Form modal state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWallet | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('checking');
  const [formInitialBalance, setFormInitialBalance] = useState('');
  const [formColor, setFormColor] = useState('#820AD1');

  // Delete confirmation state
  const [accountToDelete, setAccountToDelete] = useState<AccountWallet | null>(null);

  // Compute stats for each account
  const accountsWithStats = useMemo(() => {
    return accounts.map(acc => {
      const normName = acc.name.trim().toLowerCase();
      const normId = acc.id.trim().toLowerCase();
      const txs = transactions.filter(t => {
        if (!t.account) return false;
        const tAcc = t.account.trim().toLowerCase();
        return tAcc === normName || tAcc === normId;
      });

      const totalIncome = txs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = txs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = acc.initialBalance + totalIncome - totalExpense;

      return {
        ...acc,
        currentBalance,
        totalIncome,
        totalExpense,
        txCount: txs.length,
      };
    });
  }, [accounts, transactions]);

  // Consolidated total balance
  const totalBalance = useMemo(() => {
    return accountsWithStats.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accountsWithStats]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    if (filterType === 'all') return accountsWithStats;
    return accountsWithStats.filter(acc => acc.type === filterType);
  }, [accountsWithStats, filterType]);

  const handleOpenAddForm = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('checking');
    setFormInitialBalance('');
    setFormColor('#820AD1');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (acc: AccountWallet) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormInitialBalance(acc.initialBalance.toString().replace('.', ','));
    setFormColor(acc.color || '#820AD1');
    setIsFormOpen(true);
  };

  const handlePresetSelect = (preset: typeof PRESET_BANKS[0]) => {
    setFormName(preset.name);
    setFormType(preset.type);
    setFormColor(preset.color);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      onShowToast('Nome obrigatório', 'Dê um nome para a sua conta ou carteira.', 'warning');
      return;
    }

    const cleanBalance = formInitialBalance.trim().replace(/\./g, '').replace(',', '.');
    const parsedInitial = cleanBalance ? parseFloat(cleanBalance) : 0;

    if (isNaN(parsedInitial)) {
      onShowToast('Saldo inválido', 'Digite um saldo inicial válido em reais.', 'warning');
      return;
    }

    if (editingAccount) {
      // Editing
      const oldName = editingAccount.name;
      const updated: AccountWallet = {
        ...editingAccount,
        name: formName.trim(),
        type: formType,
        initialBalance: Math.round(parsedInitial * 100) / 100,
        color: formColor,
      };
      onSaveAccount(updated, false, oldName);
      onShowToast('Conta atualizada', `${updated.name} foi atualizada com sucesso.`, 'success');
    } else {
      // Creating
      const newAcc: AccountWallet = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        type: formType,
        initialBalance: Math.round(parsedInitial * 100) / 100,
        color: formColor,
      };
      onSaveAccount(newAcc, true);
      onShowToast('Conta adicionada', `${newAcc.name} foi cadastrada com sucesso.`, 'success');
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    onDeleteAccount(accountToDelete.id);
    onShowToast('Conta excluída', `${accountToDelete.name} foi removida da lista.`, 'info');
    setAccountToDelete(null);
  };

  const renderAccountIcon = (type: AccountType, color?: string) => {
    const iconClass = 'w-5 h-5 text-white';
    switch (type) {
      case 'cash':
        return <Wallet className={iconClass} />;
      case 'savings':
        return <PiggyBank className={iconClass} />;
      case 'investment':
        return <TrendingUp className={iconClass} />;
      case 'checking':
      default:
        return <Building2 className={iconClass} />;
    }
  };

  const getTypeName = (type: AccountType) => {
    switch (type) {
      case 'checking':
        return 'Conta Corrente';
      case 'savings':
        return 'Poupança';
      case 'investment':
        return 'Investimentos';
      case 'cash':
        return 'Carteira Física';
      default:
        return 'Conta';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Main Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Contas e Carteiras
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie seus saldos bancários, poupanças e dinheiro vivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-account"
              type="button"
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Conta</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/70 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Consolidated Balance Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 border border-white/[0.08] shadow-lg">
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mb-1">
                  <span>Saldo total em contas e carteiras</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 font-semibold">{accounts.length} ativas</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(totalBalance, isHidden)}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 border border-white/[0.06] rounded-xl px-3 py-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Os saldos se atualizam automaticamente com suas receitas e despesas</span>
              </div>
            </div>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Todas', count: accounts.length },
              { id: 'checking', label: 'Corrente', count: accounts.filter(a => a.type === 'checking').length },
              { id: 'savings', label: 'Poupança', count: accounts.filter(a => a.type === 'savings').length },
              { id: 'investment', label: 'Investimentos', count: accounts.filter(a => a.type === 'investment').length },
              { id: 'cash', label: 'Carteira Física', count: accounts.filter(a => a.type === 'cash').length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === tab.id ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {filteredAccounts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-4">
                  {filterType === 'all'
                    ? 'Você ainda não cadastrou nenhuma conta ou carteira.'
                    : `Nenhuma conta do tipo "${getTypeName(filterType as AccountType)}" encontrada.`}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Conta</span>
                </button>
              </div>
            ) : (
              filteredAccounts.map(acc => {
                const isPositive = acc.currentBalance >= 0;
                return (
                  <div
                    key={acc.id}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.06] hover:border-white/[0.12] transition-all gap-3.5"
                  >
                    {/* Left: Icon & Names */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
                        style={{ backgroundColor: acc.color || '#820AD1' }}
                      >
                        {renderAccountIcon(acc.type, acc.color)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white truncate">
                            {acc.name}
                          </h4>
                          <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md shrink-0">
                            {getTypeName(acc.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 truncate">
                          <span>Saldo inicial: {formatCurrency(acc.initialBalance, isHidden)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{acc.txCount} {acc.txCount === 1 ? 'lançamento' : 'lançamentos'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Current Balance & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-white/[0.04]">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          Saldo atual
                        </span>
                        <span
                          className={`text-base sm:text-lg font-extrabold tracking-tight ${
                            isPositive ? 'text-white' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(acc.currentBalance, isHidden)}
                        </span>
                        {acc.txCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                            {acc.totalIncome > 0 && (
                              <span className="text-emerald-400 flex items-center">
                                <ArrowDownLeft className="w-2.5 h-2.5" />
                                {formatCurrency(acc.totalIncome, isHidden)}
                              </span>
                            )}
                            {acc.totalIncome > 0 && acc.totalExpense > 0 && <span>/</span>}
                            {acc.totalExpense > 0 && (
                              <span className="text-rose-400 flex items-center">
                                <ArrowUpRight className="w-2.5 h-2.5" />
                                {formatCurrency(acc.totalExpense, isHidden)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(acc)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                          title="Editar conta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(acc)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Excluir conta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-400">
          <span>
            {accounts.length} {accounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>

        {/* Nested Add / Edit Account Form Dialog */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: formColor }}
                    >
                      {renderAccountIcon(formType)}
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {editingAccount ? 'Editar Conta' : 'Nova Conta ou Carteira'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveForm} className="space-y-4">
                  {/* Preset bank quick suggestions (only when adding new) */}
                  {!editingAccount && (
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Sugestões rápidas
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_BANKS.slice(0, 8).map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] text-xs text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: preset.color }}
                            />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nome da conta */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Nome da Conta <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nubank, Itaú, Carteira de Dinheiro, Poupança..."
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Tipo de conta */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Tipo de Conta
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'checking' as AccountType, label: 'Corrente', icon: Building2, desc: 'Bancos e Pix' },
                        { id: 'savings' as AccountType, label: 'Poupança', icon: PiggyBank, desc: 'Reserva' },
                        { id: 'investment' as AccountType, label: 'Investimentos', icon: TrendingUp, desc: 'Aplicações' },
                        { id: 'cash' as AccountType, label: 'Carteira Física', icon: Wallet, desc: 'Dinheiro vivo' },
                      ].map(t => {
                        const IconComponent = t.icon;
                        const isSelected = formType === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormType(t.id)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                            <div>
                              <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {t.label}
                              </div>
                              <div className="text-[10px] text-zinc-400">{t.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Saldo Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Saldo Inicial (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                        R$
                      </span>
                      <input
                        type="text"
                        placeholder="0,00"
                        value={formInitialBalance}
                        onChange={e => setFormInitialBalance(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      O saldo atual será calculado somando este saldo inicial a todas as receitas e despesas vinculadas a esta conta.
                    </p>
                  </div>

                  {/* Cor da Conta */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Cor de Identificação
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PALETTE.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: color }}
                        >
                          {formColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {accountToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-rose-400">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Excluir Conta</h3>
                    <p className="text-xs text-zinc-400">Esta ação não pode ser desfeita</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Tem certeza que deseja excluir a conta <strong className="text-white">"{accountToDelete.name}"</strong>?
                  Suas movimentações anteriores não serão apagadas, mas deixarão de somar neste saldo específico.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAccountToDelete(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
