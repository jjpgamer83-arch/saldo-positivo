import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar,
  Tag,
  CreditCard as CardIcon,
  RotateCcw,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Transaction, Category, CreditCard, UIStatus, TransactionType, AccountWallet } from '../../types';
import { formatCurrency, formatTransactionGroupDate, getCategoryById } from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';
import {
  TransactionFiltersModal,
  TransactionFilterCriteria,
  DEFAULT_FILTERS,
} from './TransactionFiltersModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { ErrorStateView } from '../StateViews';

export type QuickPeriod = 'all' | 'today' | '7days' | 'month';

interface TransactionsScreenProps {
  transactions: Transaction[];
  cards?: CreditCard[];
  categories?: Category[];
  accounts?: AccountWallet[];
  isHidden?: boolean;
  uiStatus?: UIStatus;
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onRetry?: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  cards = [],
  categories,
  accounts = [],
  isHidden = false,
  uiStatus = 'idle',
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onRetry,
}) => {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Quick period filter
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('all');

  // Advanced filters state
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilterCriteria>(DEFAULT_FILTERS);

  // Detail & Delete Modals state
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Helper: Count active advanced filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.categoryId !== 'all') count++;
    if (filters.account !== 'all') count++;
    if (filters.cardId !== 'all') count++;
    if (filters.paymentMethod !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  }, [filters]);

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const currentMonthStr = `${yyyy}-${mm}`;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenYyyy = sevenDaysAgo.getFullYear();
    const sevenMm = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0');
    const sevenDd = String(sevenDaysAgo.getDate()).padStart(2, '0');
    const sevenDaysAgoStr = `${sevenYyyy}-${sevenMm}-${sevenDd}`;

    return transactions.filter(tx => {
      // 1. Text Search across description, category, account, observation
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = getCategoryById(tx.categoryId, categories);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = cat.name.toLowerCase().includes(q);
        const matchAccount = (tx.account || '').toLowerCase().includes(q);
        const matchObs = (tx.observation || '').toLowerCase().includes(q);
        const matchMethod = (tx.paymentMethod || '').toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchAccount && !matchObs && !matchMethod) {
          return false;
        }
      }

      // 2. Quick Period
      if (quickPeriod === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (quickPeriod === '7days') {
        if (tx.date < sevenDaysAgoStr || tx.date > todayStr) return false;
      } else if (quickPeriod === 'month') {
        if (!tx.date.startsWith(currentMonthStr)) return false;
      }

      // 3. Advanced Filter: Type
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      // 4. Advanced Filter: Category
      if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) {
        return false;
      }

      // 5. Advanced Filter: Account
      if (filters.account !== 'all' && tx.account !== filters.account) {
        return false;
      }

      // 6. Advanced Filter: Card
      if (filters.cardId !== 'all' && tx.cardId !== filters.cardId) {
        return false;
      }

      // 7. Advanced Filter: Payment Method
      if (filters.paymentMethod !== 'all' && tx.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // 8. Advanced Filter: Date range
      if (filters.startDate && tx.date < filters.startDate) {
        return false;
      }
      if (filters.endDate && tx.date > filters.endDate) {
        return false;
      }

      // 9. Advanced Filter: Amount range
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount);
        if (!isNaN(min) && tx.amount < min) return false;
      }
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount);
        if (!isNaN(max) && tx.amount > max) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, quickPeriod, filters, categories]);

  // Group filtered transactions by date (descending)
  const groupedTransactions = useMemo(() => {
    // Sort transactions by date descending, then id
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return b.id.localeCompare(a.id);
    });

    const groups: { date: string; title: string; items: Transaction[]; dayTotal: number }[] = [];
    const groupMap = new Map<string, Transaction[]>();

    sorted.forEach(tx => {
      const current = groupMap.get(tx.date) || [];
      current.push(tx);
      groupMap.set(tx.date, current);
    });

    groupMap.forEach((items, date) => {
      // Calculate net or expense for day
      const dayTotal = items.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, 0);

      groups.push({
        date,
        title: formatTransactionGroupDate(date),
        items,
        dayTotal,
      });
    });

    return groups;
  }, [filteredTransactions]);

  // Dynamic Summary Metrics (Entradas, Saídas, Saldo) for current filtered results
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }, [filteredTransactions]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setQuickPeriod('all');
    setFilters(DEFAULT_FILTERS);
  };

  const hasAnyFilterActive =
    searchQuery.trim() !== '' || quickPeriod !== 'all' || activeFiltersCount > 0;

  // Format payment / account label
  const getTransactionSubtitle = (tx: Transaction) => {
    const parts: string[] = [];
    const cat = getCategoryById(tx.categoryId, categories);
    parts.push(cat.name);

    if (tx.account) {
      parts.push(tx.account);
    }

    if (tx.paymentMethod) {
      const methodLabels: Record<string, string> = {
        pix: 'Pix',
        credit_card: 'Crédito',
        debit: 'Débito',
        cash: 'Dinheiro',
        transfer: 'TED',
        boleto: 'Boleto',
      };
      parts.push(methodLabels[tx.paymentMethod] || tx.paymentMethod);
    }

    return parts.join(' • ');
  };

  return (
    <div id="screen-transactions" className="flex flex-col gap-4 pb-28 max-w-xl mx-auto">
      {/* 1. CABEÇALHO */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Movimentações
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {filteredTransactions.length === 1
              ? '1 movimentação no período'
              : `${filteredTransactions.length} movimentações no período`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced Filters Button */}
          <button
            id="btn-open-advanced-filters"
            type="button"
            onClick={() => setIsFiltersModalOpen(true)}
            className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
            }`}
            title="Filtros avançados"
            aria-label="Abrir filtros avançados"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-black text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* New Transaction Button */}
          <button
            id="btn-new-transaction-header"
            type="button"
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE PESQUISA */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          id="input-search-transactions"
          type="text"
          placeholder="Buscar movimentação por nome, categoria ou conta..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            aria-label="Limpar busca"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 3. FILTROS RÁPIDOS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setQuickPeriod('all')}
          className={`py-1.5 px-3 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
            quickPeriod === 'all'
              ? 'bg-emerald-400 text-black font-bold shadow-sm'
              : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todos
        </button>

        <button
          type="button"
          onClick={() => setQuickPeriod('today')}
          className={`py-1.5 px-3 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
            quickPeriod === 'today'
              ? 'bg-emerald-400 text-black font-bold shadow-sm'
              : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={() => setQuickPeriod('7days')}
          className={`py-1.5 px-3 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
            quickPeriod === '7days'
              ? 'bg-emerald-400 text-black font-bold shadow-sm'
              : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          7 dias
        </button>

        <button
          type="button"
          onClick={() => setQuickPeriod('month')}
          className={`py-1.5 px-3 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
            quickPeriod === 'month'
              ? 'bg-emerald-400 text-black font-bold shadow-sm'
              : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Este mês
        </button>

        {/* Shortcut to open advanced filters */}
        <button
          type="button"
          onClick={() => setIsFiltersModalOpen(true)}
          className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-1 whitespace-nowrap font-medium transition-all cursor-pointer ${
            activeFiltersCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
              : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Clear filters pill if any filter is active */}
        {hasAnyFilterActive && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="py-1.5 px-2 rounded-xl text-zinc-400 hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors whitespace-nowrap ml-auto"
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 4. RESUMO (3 INDICADORES: ENTRADAS, SAÍDAS, SALDO) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Entradas */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Entradas
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 tracking-tight truncate">
            {formatCurrency(summary.totalIncome, isHidden)}
          </span>
        </div>

        {/* Saídas */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Saídas
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-rose-400 tracking-tight truncate">
            {formatCurrency(summary.totalExpense, isHidden)}
          </span>
        </div>

        {/* Saldo */}
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                summary.balance >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <Wallet className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Saldo
            </span>
          </div>
          <span
            className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
              summary.balance >= 0 ? 'text-zinc-100' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.balance, isHidden)}
          </span>
        </div>
      </div>

      {/* 5. LISTA DE MOVIMENTAÇÕES AGRUPADA POR DATA */}
      {uiStatus === 'loading' ? (
        <div className="py-6 flex flex-col gap-3 animate-pulse">
          <div className="w-28 h-4 bg-zinc-800 rounded" />
          <div className="w-full h-16 rounded-2xl bg-zinc-900/60 border border-white/5" />
          <div className="w-full h-16 rounded-2xl bg-zinc-900/60 border border-white/5" />
          <div className="w-full h-16 rounded-2xl bg-zinc-900/60 border border-white/5" />
        </div>
      ) : uiStatus === 'error' ? (
        <ErrorStateView
          title="Conector SQL Connect não publicado"
          message="O conector 'default' ainda não foi publicado no serviço 'saldo-e77f8-service' (southamerica-east1). Para publicá-lo, execute no terminal do projeto:"
          commandSnippet="firebase deploy --only dataconnect"
          onRetry={onRetry || (() => {})}
        />
      ) : groupedTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-400">
            <ArrowUpDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200">
              Nenhuma movimentação encontrada
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1">
              {hasAnyFilterActive
                ? 'Tente remover os filtros ou buscar por outro termo para visualizar seus lançamentos.'
                : 'Você ainda não cadastrou movimentações neste período.'}
            </p>
          </div>

          {hasAnyFilterActive ? (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="mt-2 py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Limpar busca e filtros</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAddModal('expense')}
              className="mt-2 py-2 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar movimentação</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedTransactions.map(group => (
            <div key={group.date} className="flex flex-col gap-1.5">
              {/* Group Date Header */}
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-bold text-zinc-400 tracking-wide">
                  {group.title}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    group.dayTotal >= 0 ? 'text-emerald-400/80' : 'text-zinc-500'
                  }`}
                >
                  {group.dayTotal >= 0 ? '+' : ''}
                  {formatCurrency(group.dayTotal, isHidden)}
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div className="flex flex-col gap-1.5">
                {group.items.map(tx => {
                  const isIncome = tx.type === 'income';
                  const category = getCategoryById(tx.categoryId, categories);

                  return (
                    <motion.div
                      key={tx.id}
                      onClick={() => setSelectedTxForDetail(tx)}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/15 hover:bg-zinc-800/60 transition-all cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalhes de ${tx.description}`}
                    >
                      {/* Left: Category Icon + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border bg-zinc-950/80"
                            style={{
                              borderColor: `${category.color}35`,
                              color: category.color,
                            }}
                          >
                            <CategoryIcon name={category.icon} className="w-4 h-4" />
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950 text-[9px] ${
                              isIncome
                                ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                              <ArrowDownLeft className="w-2.5 h-2.5 stroke-[3]" />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                            {tx.description}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {getTransactionSubtitle(tx)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & Type Badge */}
                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`text-xs sm:text-sm font-bold tracking-tight block ${
                            isIncome ? 'text-emerald-400' : 'text-zinc-200'
                          }`}
                        >
                          {isIncome ? '+ ' : '- '}
                          {formatCurrency(tx.amount, isHidden)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters Modal */}
      <TransactionFiltersModal
        isOpen={isFiltersModalOpen}
        filters={filters}
        categories={categories}
        cards={cards}
        availableAccounts={accounts.length > 0 ? accounts.map(a => a.name) : undefined}
        onClose={() => setIsFiltersModalOpen(false)}
        onApply={newFilters => setFilters(newFilters)}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTxForDetail)}
        transaction={selectedTxForDetail}
        cards={cards}
        isHidden={isHidden}
        onClose={() => setSelectedTxForDetail(null)}
        onEdit={tx => {
          setSelectedTxForDetail(null);
          onEditTransaction(tx);
        }}
        onDeleteRequest={tx => {
          setSelectedTxForDetail(null);
          setTxToDelete(tx);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={Boolean(txToDelete)}
        transaction={txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirmDelete={id => {
          onDeleteTransaction(id);
          setTxToDelete(null);
        }}
      />
    </div>
  );
};
