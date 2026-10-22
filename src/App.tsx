import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, dataConnect } from './lib/firebase';
import { useAuth } from './contexts/AuthContext';
import {
  listTransactions,
  listCategories,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createCategory,
} from '@firebasegen/default-connector';
import {
  Transaction,
  Category,
  UpcomingBill,
  Budget,
  TabType,
  UIStatus,
  ToastMessage,
  TransactionType,
  CreditCard,
  Invoice,
  CreditCardPurchase,
  CategoryBudget,
  FinancialGoal,
  AccountWallet,
  NotificationSettings,
  AppNotification,
  SecuritySettings,
  AutoLockTimeout,
  GeneralPreferences,
  ThemeMode,
  CurrencyCode,
  FirstDayOfWeek,
  DateFormatOption,
} from './types';
import {
  INITIAL_CATEGORIES,
} from './data/mockData';

const EMPTY_BUDGET: Budget = {
  monthlyLimit: 0,
};

// IDs de dados mockados para garantir purga e isolamento limpo entre usuários
const MOCK_TRANSACTION_IDS = new Set([
  'tx-0a', 'tx-0b', 'tx-0c', 'tx-0d', 'tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7'
]);
const MOCK_CARD_IDS = new Set(['card-nubank', 'card-itau', 'card-inter']);
const MOCK_ACCOUNT_IDS = new Set(['acc-nubank', 'acc-itau', 'acc-inter', 'acc-carteira', 'acc-poupanca']);
const MOCK_GOAL_IDS = new Set(['goal-1', 'goal-2', 'goal-3']);
const MOCK_INVOICE_IDS = new Set([
  'inv-nubank-sep', 'inv-nubank-oct', 'inv-nubank-nov', 'inv-nubank-dec',
  'inv-itau-sep', 'inv-itau-oct',
  'inv-inter-sep'
]);
const MOCK_PURCHASE_IDS = new Set(['cp-nb-1', 'cp-nb-2', 'cp-nb-3', 'cp-nb-4', 'cp-nb-5', 'cp-nb-6', 'pur-1', 'pur-2', 'pur-3']);
const MOCK_BILL_IDS = new Set(['bill-1', 'bill-2', 'bill-3']);

import {
  calculateFinancialSummary,
  setGlobalCurrency,
  setGlobalDateFormat,
} from './utils/formatters';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseChart } from './components/ExpenseChart';
import { BudgetLimitCard } from './components/BudgetLimitCard';
import { ContextualInsight } from './components/ContextualInsight';
import { UpcomingBills } from './components/UpcomingBills';
import { RecentTransactions } from './components/RecentTransactions';
import { BottomNavigation } from './components/BottomNavigation';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ProvisionalView } from './components/ProvisionalView';
import { LoadingSkeleton, EmptyStateView, ErrorStateView } from './components/StateViews';
import { ToastContainer } from './components/Toast';
import { TransactionsScreen } from './components/transactions/TransactionsScreen';
import { PlanningScreen } from './components/planning/PlanningScreen';
import { MoreScreen } from './components/more/MoreScreen';
import { AccountsModal } from './components/accounts/AccountsModal';
import {
  NotificationsModal,
  DEFAULT_NOTIFICATION_SETTINGS,
  generateContextualNotifications,
} from './components/notifications/NotificationsModal';
import { SecurityModal, DEFAULT_SECURITY_SETTINGS } from './components/security/SecurityModal';
import { LockScreen } from './components/security/LockScreen';
import {
  PreferencesModal,
  DEFAULT_GENERAL_PREFERENCES,
} from './components/preferences/PreferencesModal';
import { ExportReportModal } from './components/export/ExportReportModal';
import { PendingTransactionsModal } from './components/notifications/PendingTransactionsModal';
import { SettingsModal } from './components/SettingsModal';
import { ParsedBankTransaction, RawBankNotification } from './types';
import {
  getBankDetectionSettings,
  getPendingBankTransactions,
  savePendingBankTransactions,
  removePendingBankTransaction,
  isNotificationAlreadyProcessed,
  markNotificationAsProcessed,
  parseBankNotification,
  waitForDeviceReady,
  isCapacitorNative,
} from './services/notificationListener';
import {
  initializeAdMob,
  recordTransactionActionAndMaybeShowInterstitial,
} from './services/admobService';
import { Wallet, Loader2, ArrowLeft, CheckCircle2, BellRing, X } from 'lucide-react';

const DEFAULT_GUEST_USER = {
  uid: 'meubolso_user',
  displayName: 'MeuBolso',
  email: 'usuario@meubolso.app',
};

const STARTER_ACCOUNTS: AccountWallet[] = [
  {
    id: 'acc-nu',
    name: 'Nubank',
    type: 'checking',
    initialBalance: 2850.50,
    color: '#820AD1',
    icon: 'Smartphone',
  },
  {
    id: 'acc-cash',
    name: 'Carteira Física',
    type: 'cash',
    initialBalance: 240.00,
    color: '#10B981',
    icon: 'Wallet',
  },
  {
    id: 'acc-itau',
    name: 'Itaú Reserva',
    type: 'savings',
    initialBalance: 5120.00,
    color: '#EC7000',
    icon: 'Building2',
  },
];

const STARTER_CARDS: CreditCard[] = [
  {
    id: 'card-nu',
    name: 'Nubank Ultravioleta',
    bank: 'Nubank',
    lastFourDigits: '4892',
    brand: 'Mastercard',
    limit: 6500,
    closingDay: 3,
    dueDay: 10,
    colorTheme: 'purple',
  },
];

const STARTER_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-starter-1',
    description: 'Salário Mensal',
    amount: 5200.00,
    type: 'income',
    categoryId: 'salario',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    account: 'Nubank',
    paymentMethod: 'pix',
  },
  {
    id: 'tx-starter-2',
    description: 'Supermercado Pão de Açúcar',
    amount: 412.80,
    type: 'expense',
    categoryId: 'alimentacao',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    account: 'Nubank',
    paymentMethod: 'credit',
  },
  {
    id: 'tx-starter-3',
    description: 'Posto Shell Combustível',
    amount: 160.00,
    type: 'expense',
    categoryId: 'transporte',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'completed',
    account: 'Nubank',
    paymentMethod: 'debit',
  },
  {
    id: 'tx-starter-4',
    description: 'Assinatura Netflix',
    amount: 55.90,
    type: 'expense',
    categoryId: 'assinaturas',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    status: 'completed',
    account: 'Nubank',
    paymentMethod: 'credit',
  },
];

export default function App() {
  const { user } = useAuth();
  const activeUser = user || DEFAULT_GUEST_USER;

  // Authentication UI state (opcional via modal, nunca bloqueia inicialização da tela)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial data state (inicializado estritamente zerado para novas contas)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactionsUiStatus, setTransactionsUiStatus] = useState<UIStatus>('loading');
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [budget, setBudget] = useState<Budget>(EMPTY_BUDGET);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  // Credit cards & invoices state
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cardPurchases, setCardPurchases] = useState<CreditCardPurchase[]>([]);

  // Contas bancárias e carteiras
  const [accounts, setAccounts] = useState<AccountWallet[]>([]);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  // Notificações e alertas
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Segurança e privacidade
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Preferências gerais (tema, moeda, primeiro dia, formato data, vibração)
  const [generalPreferences, setGeneralPreferences] = useState<GeneralPreferences>(DEFAULT_GENERAL_PREFERENCES);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState<{ name: string; email: string }>({
    name: '',
    email: '',
  });

  // UI preferences & navigation state
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modal & Toast states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<TransactionType>('expense');
  const [addModalInitialDate, setAddModalInitialDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Detecção Automática de Notificações Bancárias
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPendingBankModalOpen, setIsPendingBankModalOpen] = useState(false);
  const [pendingBankTransactions, setPendingBankTransactions] = useState<ParsedBankTransaction[]>([]);

  // Referência do UID atualmente ativo e carregado na memória da aplicação
  const activeUidRef = useRef<string | null>(null);

  // Toast dispatcher
  const showToast = useCallback((
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Limpa imediatamente todos os estados da memória da aplicação (Requisito 3)
  const clearAllMemoryState = useCallback(() => {
    activeUidRef.current = null;
    setTransactions([]);
    setCategories(INITIAL_CATEGORIES);
    setTransactionsUiStatus('empty');
    setUpcomingBills([]);
    setBudget(EMPTY_BUDGET);
    setCategoryBudgets([]);
    setGoals([]);
    setCards([]);
    setInvoices([]);
    setCardPurchases([]);
    setAccounts([]);
    setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    setReadNotificationIds([]);
    setDismissedNotificationIds([]);
    setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
    setGeneralPreferences(DEFAULT_GENERAL_PREFERENCES);
    setGlobalCurrency(DEFAULT_GENERAL_PREFERENCES.currency);
    setGlobalDateFormat(DEFAULT_GENERAL_PREFERENCES.dateFormat);
    setIsAppLocked(false);
    setIsHidden(false);
    setUserProfile({ name: '', email: '' });
  }, []);

  // Carrega todos os dados vinculados estritamente ao user.uid autenticado (Requisitos 1, 2 e 4)
  const loadUserData = useCallback(async (currentUser: { uid: string; displayName: string | null; email: string | null }) => {
    const uid = currentUser.uid;

    // 1. Limpeza imediata da memória antes de ler os dados da nova conta
    clearAllMemoryState();
    setTransactionsUiStatus('loading');

    // 2. Perfil
    const savedProfile = localStorage.getItem(`@saldo_${uid}_profile`);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile({
          name: parsed.name || currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : ''),
          email: parsed.email || currentUser.email || '',
        });
      } catch (_) {
        setUserProfile({
          name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : ''),
          email: currentUser.email || '',
        });
      }
    } else {
      setUserProfile({
        name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : ''),
        email: currentUser.email || '',
      });
    }

    // 3. Cartões de crédito
    const savedCards = localStorage.getItem(`@saldo_${uid}_cards`);
    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards);
        setCards(Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_CARDS);
      } catch (_) { setCards(STARTER_CARDS); }
    } else {
      setCards(STARTER_CARDS);
      localStorage.setItem(`@saldo_${uid}_cards`, JSON.stringify(STARTER_CARDS));
    }

    // 4. Faturas
    const savedInvoices = localStorage.getItem(`@saldo_${uid}_invoices`);
    if (savedInvoices) {
      try {
        const parsed = JSON.parse(savedInvoices);
        setInvoices(Array.isArray(parsed) ? parsed : []);
      } catch (_) { setInvoices([]); }
    } else {
      setInvoices([]);
    }

    // 5. Compras no cartão
    const savedPurchases = localStorage.getItem(`@saldo_${uid}_purchases`);
    if (savedPurchases) {
      try {
        const parsed = JSON.parse(savedPurchases);
        setCardPurchases(Array.isArray(parsed) ? parsed : []);
      } catch (_) { setCardPurchases([]); }
    } else {
      setCardPurchases([]);
    }

    // 6. Contas e carteiras
    const savedAccounts = localStorage.getItem(`@saldo_${uid}_accounts`);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        setAccounts(Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_ACCOUNTS);
      } catch (_) { setAccounts(STARTER_ACCOUNTS); }
    } else {
      setAccounts(STARTER_ACCOUNTS);
      localStorage.setItem(`@saldo_${uid}_accounts`, JSON.stringify(STARTER_ACCOUNTS));
    }

    // 7. Teto mensal de gastos
    const savedBudget = localStorage.getItem(`@saldo_${uid}_budget`);
    if (savedBudget) {
      try {
        const parsed = JSON.parse(savedBudget);
        setBudget(parsed && typeof parsed.monthlyLimit === 'number' && parsed.monthlyLimit > 0 ? parsed : { monthlyLimit: 3500 });
      } catch (_) { setBudget({ monthlyLimit: 3500 }); }
    } else {
      setBudget({ monthlyLimit: 3500 });
      localStorage.setItem(`@saldo_${uid}_budget`, JSON.stringify({ monthlyLimit: 3500 }));
    }

    // 8. Orçamentos por categoria
    const savedCatBudgets = localStorage.getItem(`@saldo_${uid}_cat_budgets`);
    if (savedCatBudgets) {
      try {
        const parsed = JSON.parse(savedCatBudgets);
        const clean = Array.isArray(parsed) ? parsed.filter(cb => !cb.id.startsWith('cb-')) : [];
        setCategoryBudgets(clean);
      } catch (_) { setCategoryBudgets([]); }
    } else {
      setCategoryBudgets([]);
    }

    // 9. Metas financeiras
    const savedGoals = localStorage.getItem(`@saldo_${uid}_goals`);
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        const clean = Array.isArray(parsed) ? parsed : [];
        setGoals(clean);
      } catch (_) { setGoals([]); }
    } else {
      setGoals([]);
    }

    // 10. Próximas contas
    const savedBills = localStorage.getItem(`@saldo_${uid}_upcoming_bills`);
    if (savedBills) {
      try {
        const parsed = JSON.parse(savedBills);
        const clean = Array.isArray(parsed) ? parsed : [];
        setUpcomingBills(clean);
      } catch (_) { setUpcomingBills([]); }
    } else {
      setUpcomingBills([]);
    }

    // 11. Notificações
    const savedNotifSettings = localStorage.getItem(`@saldo_${uid}_notification_settings`);
    if (savedNotifSettings) {
      try { setNotificationSettings(JSON.parse(savedNotifSettings)); } catch (_) {}
    } else {
      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    }

    const savedReadNotifs = localStorage.getItem(`@saldo_${uid}_notifications_read`);
    if (savedReadNotifs) {
      try { setReadNotificationIds(JSON.parse(savedReadNotifs)); } catch (_) { setReadNotificationIds([]); }
    } else {
      setReadNotificationIds([]);
    }

    const savedDismissedNotifs = localStorage.getItem(`@saldo_${uid}_notifications_dismissed`);
    if (savedDismissedNotifs) {
      try { setDismissedNotificationIds(JSON.parse(savedDismissedNotifs)); } catch (_) { setDismissedNotificationIds([]); }
    } else {
      setDismissedNotificationIds([]);
    }

    // 12. Segurança
    const savedSecurity = localStorage.getItem(`@saldo_${uid}_security_settings`);
    if (savedSecurity) {
      try {
        const parsed: SecuritySettings = JSON.parse(savedSecurity);
        setSecuritySettings(parsed);
        if (parsed.pinEnabled) {
          setIsAppLocked(true);
        }
        if (parsed.startWithHiddenBalance) {
          setIsHidden(true);
        }
      } catch (_) {}
    } else {
      setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
    }

    // 13. Preferências gerais
    const savedGeneral = localStorage.getItem(`@saldo_${uid}_general_preferences`);
    if (savedGeneral) {
      try {
        const parsed: GeneralPreferences = JSON.parse(savedGeneral);
        setGeneralPreferences(parsed);
        setGlobalCurrency(parsed.currency);
        setGlobalDateFormat(parsed.dateFormat);
      } catch (_) {}
    } else {
      setGeneralPreferences(DEFAULT_GENERAL_PREFERENCES);
      setGlobalCurrency(DEFAULT_GENERAL_PREFERENCES.currency);
      setGlobalDateFormat(DEFAULT_GENERAL_PREFERENCES.dateFormat);
    }

    // 14. Categorias
    const savedCats = localStorage.getItem(`@saldo_${uid}_categories`);
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        } else {
          setCategories(INITIAL_CATEGORIES);
        }
      } catch (_) { setCategories(INITIAL_CATEGORIES); }
    } else {
      setCategories(INITIAL_CATEGORIES);
    }

    // 15. Transações do usuário (MeuBolso inicializa com histórico completo)
    const cachedTx = localStorage.getItem(`@saldo_${uid}_transactions`);
    if (cachedTx) {
      try {
        const parsed = JSON.parse(cachedTx);
        const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_TRANSACTIONS;
        setTransactions(list);
        setTransactionsUiStatus('idle');
      } catch (_) {
        setTransactions(STARTER_TRANSACTIONS);
        setTransactionsUiStatus('idle');
      }
    } else {
      setTransactions(STARTER_TRANSACTIONS);
      localStorage.setItem(`@saldo_${uid}_transactions`, JSON.stringify(STARTER_TRANSACTIONS));
      setTransactionsUiStatus('idle');
    }

    // Vincula este UID como ativo na memória
    activeUidRef.current = uid;

    // Sincronização remota via DataConnect (se conector estiver publicado)
    try {
      try {
        const catRes = await listCategories(dataConnect);
        const fetchedCats = catRes.data?.categories || [];
        if (fetchedCats.length > 0 && activeUidRef.current === uid) {
          const mappedCats: Category[] = fetchedCats.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            bgLight: c.bgLight,
            type: c.type as TransactionType | 'both',
          }));
          setCategories(mappedCats);
          localStorage.setItem(`@saldo_${uid}_categories`, JSON.stringify(mappedCats));
        }
      } catch (_) {}

      const txRes = await listTransactions(dataConnect);
      const fetchedTxs = txRes.data?.transactions || [];
      const loaded: Transaction[] = fetchedTxs.map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        type: item.type as TransactionType,
        categoryId: item.category?.id || '',
        date: item.date,
        status: (item.status as 'completed' | 'pending') || 'completed',
        account: item.account || undefined,
        paymentMethod: item.paymentMethod || undefined,
        observation: item.observation || undefined,
      }));

      if (activeUidRef.current === uid) {
        setTransactions(loaded);
        localStorage.setItem(`@saldo_${uid}_transactions`, JSON.stringify(loaded));
        setTransactionsUiStatus(loaded.length === 0 ? 'empty' : 'idle');
      }
    } catch (_) {
      // Se DataConnect estiver indisponível/pendente, preserva os dados locais sem erro
    }
  }, [clearAllMemoryState]);

  // Recarregamento seguro de transações do DataConnect
  const loadDataConnectData = useCallback(async () => {
    if (!user) return;
    const uid = user.uid;
    try {
      const txRes = await listTransactions(dataConnect);
      const fetchedTxs = txRes.data?.transactions || [];
      const loaded: Transaction[] = fetchedTxs.map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        type: item.type as TransactionType,
        categoryId: item.category?.id || '',
        date: item.date,
        status: (item.status as 'completed' | 'pending') || 'completed',
        account: item.account || undefined,
        paymentMethod: item.paymentMethod || undefined,
        observation: item.observation || undefined,
      }));

      if (activeUidRef.current === uid) {
        setTransactions(loaded);
        localStorage.setItem(`@saldo_${uid}_transactions`, JSON.stringify(loaded));
        setTransactionsUiStatus(loaded.length === 0 ? 'empty' : 'idle');
      }
    } catch (_) {
      // Mantém dados locais
    }
  }, [user]);


  // Efeito de autenticação e carga de dados do MeuBolso
  useEffect(() => {
    const current = user || DEFAULT_GUEST_USER;
    if (activeUidRef.current !== current.uid) {
      loadUserData(current);
    }
  }, [user, loadUserData]);

  // Persistência local automática vinculada exclusivamente ao activeUser.uid ativo
  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_general_preferences`, JSON.stringify(generalPreferences));
  }, [generalPreferences, activeUser]);

  // Sincronizar tema no HTML e meta tags
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', '#090a0f');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', '#f8fafc');
      }
    };

    if (generalPreferences.theme === 'dark') {
      applyTheme(true);
    } else if (generalPreferences.theme === 'light') {
      applyTheme(false);
    } else {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(media.matches);
        const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      } else {
        applyTheme(true);
      }
    }
  }, [generalPreferences.theme]);

  // Sincronizar formatadores globais de moeda e data
  useEffect(() => {
    setGlobalCurrency(generalPreferences.currency);
  }, [generalPreferences.currency]);

  useEffect(() => {
    setGlobalDateFormat(generalPreferences.dateFormat);
  }, [generalPreferences.dateFormat]);

  // Persistência local automática estritamente por UID ativo
  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_security_settings`, JSON.stringify(securitySettings));
  }, [securitySettings, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_notification_settings`, JSON.stringify(notificationSettings));
  }, [notificationSettings, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_notifications_read`, JSON.stringify(readNotificationIds));
  }, [readNotificationIds, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_notifications_dismissed`, JSON.stringify(dismissedNotificationIds));
  }, [dismissedNotificationIds, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_accounts`, JSON.stringify(accounts));
  }, [accounts, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_cards`, JSON.stringify(cards));
  }, [cards, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_invoices`, JSON.stringify(invoices));
  }, [invoices, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_purchases`, JSON.stringify(cardPurchases));
  }, [cardPurchases, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_budget`, JSON.stringify(budget));
  }, [budget, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_cat_budgets`, JSON.stringify(categoryBudgets));
  }, [categoryBudgets, activeUser]);

  useEffect(() => {
    if (activeUidRef.current !== activeUser.uid) return;
    localStorage.setItem(`@saldo_${activeUser.uid}_goals`, JSON.stringify(goals));
  }, [goals, activeUser]);

  useEffect(() => {
    if (!user || activeUidRef.current !== user.uid) return;
    localStorage.setItem(`@saldo_${user.uid}_upcoming_bills`, JSON.stringify(upcomingBills));
  }, [upcomingBills, user]);

  useEffect(() => {
    if (!user || activeUidRef.current !== user.uid) return;
    localStorage.setItem(`@saldo_${user.uid}_categories`, JSON.stringify(categories));
  }, [categories, user]);

  useEffect(() => {
    if (!user || activeUidRef.current !== user.uid) return;
    localStorage.setItem(`@saldo_${user.uid}_profile`, JSON.stringify(userProfile));
  }, [userProfile, user]);

  useEffect(() => {
    if (!user || activeUidRef.current !== user.uid) return;
    localStorage.setItem(`@saldo_${user.uid}_transactions`, JSON.stringify(transactions));
  }, [transactions, user]);

  const currentMonthStr = useMemo(() => {
    const monthsFull = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const now = new Date();
    return `${monthsFull[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const handleToggleHide = () => {
    setIsHidden(prev => {
      const next = !prev;
      showToast(
        next ? 'Valores ocultados' : 'Valores visíveis',
        next ? 'Informações financeiras protegidas.' : 'Exibindo saldo e movimentações.',
        'info'
      );
      return next;
    });
  };

  const handleAddTransaction = async (
    newTx: Omit<Transaction, 'id' | 'status'>,
    cardPurchaseData?: {
      cardId: string;
      isInstallment: boolean;
      totalInstallments?: number;
    }
  ) => {
    if (cardPurchaseData && newTx.type === 'expense') {
      const card = cards.find(c => c.id === cardPurchaseData.cardId);
      const isInst = cardPurchaseData.isInstallment && (cardPurchaseData.totalInstallments || 1) > 1;
      const totalInst = cardPurchaseData.totalInstallments || 1;
      const instAmount = isInst ? newTx.amount / totalInst : newTx.amount;

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, card?.dueDay || 10);
      const nextDateStr = nextMonth.toISOString().split('T')[0];
      const activeInvoice = invoices.find(inv => inv.cardId === cardPurchaseData.cardId && inv.status === 'open');

      const createdPurchase: CreditCardPurchase = {
        id: `pur-${Date.now()}`,
        cardId: cardPurchaseData.cardId,
        invoiceId: activeInvoice?.id || `inv-${cardPurchaseData.cardId}`,
        description: newTx.description,
        amount: Math.round(instAmount * 100) / 100,
        totalAmount: newTx.amount,
        categoryId: newTx.categoryId,
        date: newTx.date,
        isInstallment: isInst,
        installmentInfo: isInst
          ? {
              currentInstallment: 1,
              totalInstallments: totalInst,
              installmentAmount: Math.round(instAmount * 100) / 100,
              purchaseDate: newTx.date,
              nextInstallmentDate: nextDateStr,
            }
          : undefined,
      };

      setCardPurchases(prev => [createdPurchase, ...prev]);
      showToast(
        'Compra no cartão adicionada.',
        `${newTx.description} lançada na fatura de ${card?.name || 'cartão'}.`,
        'success'
      );
      return;
    }

    try {
      let targetCategoryId = newTx.categoryId;
      const matchedCategory = categories.find(c => c.id === targetCategoryId);
      if (!matchedCategory && categories.length > 0) {
        targetCategoryId = categories[0].id;
      }

      try {
        await createTransaction(dataConnect, {
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          categoryId: targetCategoryId,
          date: newTx.date,
          status: 'completed',
          account: newTx.account || null,
          paymentMethod: newTx.paymentMethod || null,
          observation: newTx.observation || null,
        });
        await loadDataConnectData();
      } catch (dcErr) {
        console.warn('Data Connect indisponível, salvando localmente:', dcErr);
        const localTx: Transaction = {
          id: `tx-${Date.now()}`,
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          categoryId: targetCategoryId,
          date: newTx.date,
          status: 'completed',
          account: newTx.account,
          paymentMethod: newTx.paymentMethod,
          observation: newTx.observation,
          metadata: newTx.metadata,
        };
        setTransactions(prev => {
          const updated = [localTx, ...prev];
          if (user) localStorage.setItem(`@saldo_${user.uid}_transactions`, JSON.stringify(updated));
          return updated;
        });
      }

      showToast(
        newTx.type === 'income' ? 'Receita adicionada' : 'Despesa adicionada',
        newTx.description,
        'success'
      );

      // Dispara contador do AdMob e exibe Intersticial a cada 3 transações salvas ou importadas
      recordTransactionActionAndMaybeShowInterstitial().catch(adErr => {
        console.warn('[AdMob]: Falha silenciosa no intersticial:', adErr);
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast('Erro ao salvar movimentação', 'Tente novamente.', 'error');
    }
  };

  // ==========================================
  // GOOGLE ADMOB (BANNER INFERIOR E INTERSTITIAL)
  // ==========================================

  useEffect(() => {
    // DESACOPLADO DA RENDERIZAÇÃO INICIAL:
    // Aguarda 3 segundos após a interface estar 100% visível na tela sem travar a interface
    const timer = setTimeout(() => {
      try {
        initializeAdMob().catch(err => {
          console.warn('AdMob error ignored (decoupled init):', err);
        });
      } catch (err) {
        console.warn('AdMob error ignored (sync init error):', err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // DETECÇÃO AUTOMÁTICA DE DESPESAS BANCÁRIAS (ANDROID / CAPACITOR)
  // ==========================================

  useEffect(() => {
    const saved = getPendingBankTransactions();
    if (saved && saved.length > 0) {
      setPendingBankTransactions(saved);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const processIncomingNotification = async (raw: RawBankNotification) => {
      try {
        const settings = getBankDetectionSettings();
        if (!settings.enabled) return;
        if (!settings.whitelistedBanks.includes(raw.packageName)) return;

        const parsed = await parseBankNotification(raw);
        if (!parsed) return;
        if (isNotificationAlreadyProcessed(parsed.hash)) return;

        if (settings.autoApproveHighConfidence && parsed.confidence === 'high' && !parsed.isAmbiguous) {
          handleAddTransaction({
            description: parsed.description,
            amount: parsed.amount,
            type: parsed.type,
            categoryId: parsed.suggestedCategoryId || categories[0]?.id || 'outros',
            date: parsed.date,
            paymentMethod: parsed.paymentMethod,
            observation: `Detectado via notificação bancária (${parsed.bankName})`,
            metadata: {
              rawNotificationId: parsed.rawNotificationId,
              packageName: parsed.packageName,
              bankName: parsed.bankName,
              detectedHash: parsed.hash,
              isAutoDetected: true,
              confidence: parsed.confidence,
              originalText: parsed.rawText,
            },
          });
          markNotificationAsProcessed(parsed.hash);
          showToast(
            'Despesa bancária detectada!',
            `"${parsed.description}" (R$ ${parsed.amount.toFixed(2)}) lançada automaticamente via ${parsed.bankName}.`,
            'success'
          );
        } else {
          setPendingBankTransactions(prev => {
            if (prev.some(p => p.hash === parsed.hash)) return prev;
            const next = [parsed, ...prev];
            savePendingBankTransactions(next);
            return next;
          });
          showToast(
            'Nova despesa detectada',
            `"${parsed.description}" do ${parsed.bankName} aguarda sua confirmação.`,
            'info'
          );
        }
      } catch (procErr) {
        console.warn('Erro seguro ao processar notificação bancária:', procErr);
      }
    };

    const initBankNotifications = async () => {
      try {
        // Aguarda evento nativo 'deviceready' ou timeout sem jamais travar a interface
        await waitForDeviceReady();

        if (!isMounted) return;

        if (typeof window === 'undefined' || !isCapacitorNative() || !window.Capacitor?.Plugins?.BankNotificationPlugin) {
          return;
        }

        const plugin = window.Capacitor.Plugins.BankNotificationPlugin;
        if (typeof plugin.getPendingNotifications !== 'function') {
          return;
        }

        const res = await plugin.getPendingNotifications().catch(err => {
          console.warn('Falha segura ao buscar notificações pendentes:', err);
          return null;
        });

        if (!isMounted || !res || !res.notifications || !Array.isArray(res.notifications)) {
          return;
        }

        for (const raw of res.notifications) {
          await processIncomingNotification(raw);
        }
      } catch (err) {
        console.warn('Falha silenciosa no listener de notificações nativas:', err);
      }
    };

    // Executa de forma assíncrona após 300ms para priorizar totalmente a renderização visual do app
    const timer = setTimeout(() => {
      initBankNotifications().catch(() => {});
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [categories, showToast]);

  const handleConfirmPendingBankTx = (
    parsed: ParsedBankTransaction,
    selectedCategoryId: string,
    accountName?: string
  ) => {
    handleAddTransaction({
      description: parsed.description,
      amount: parsed.amount,
      type: parsed.type,
      categoryId: selectedCategoryId || parsed.suggestedCategoryId,
      date: parsed.date,
      paymentMethod: parsed.paymentMethod,
      account: accountName,
      observation: `Detectado via notificação bancária (${parsed.bankName})`,
      metadata: {
        rawNotificationId: parsed.rawNotificationId,
        packageName: parsed.packageName,
        bankName: parsed.bankName,
        detectedHash: parsed.hash,
        isAutoDetected: true,
        confidence: parsed.confidence,
        originalText: parsed.rawText,
      },
    });

    markNotificationAsProcessed(parsed.hash);
    removePendingBankTransaction(parsed.id);
    setPendingBankTransactions(prev => {
      const next = prev.filter(p => p.id !== parsed.id);
      savePendingBankTransactions(next);
      return next;
    });
  };

  const handleDiscardPendingBankTx = (id: string, hash: string) => {
    markNotificationAsProcessed(hash);
    removePendingBankTransaction(id);
    setPendingBankTransactions(prev => {
      const next = prev.filter(p => p.id !== id);
      savePendingBankTransactions(next);
      return next;
    });
  };

  const handleDiscardAllPendingBankTx = () => {
    pendingBankTransactions.forEach(item => {
      markNotificationAsProcessed(item.hash);
    });
    savePendingBankTransactions([]);
    setPendingBankTransactions([]);
    setIsPendingBankModalOpen(false);
    showToast('Fila esvaziada', 'Todas as notificações pendentes foram descartadas.', 'info');
  };

  const handleIncomingSimulatedBankTx = (parsed: ParsedBankTransaction) => {
    const settings = getBankDetectionSettings();
    if (isNotificationAlreadyProcessed(parsed.hash)) {
      showToast('Notificação já processada', 'Esta movimentação já foi lançada anteriormente.', 'info');
      return;
    }

    if (settings.autoApproveHighConfidence && parsed.confidence === 'high' && !parsed.isAmbiguous) {
      handleAddTransaction({
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        categoryId: parsed.suggestedCategoryId || categories[0]?.id || 'outros',
        date: parsed.date,
        paymentMethod: parsed.paymentMethod,
        observation: `Detectado via notificação bancária (${parsed.bankName})`,
        metadata: {
          rawNotificationId: parsed.rawNotificationId,
          packageName: parsed.packageName,
          bankName: parsed.bankName,
          detectedHash: parsed.hash,
          isAutoDetected: true,
          confidence: parsed.confidence,
          originalText: parsed.rawText,
        },
      });
      markNotificationAsProcessed(parsed.hash);
      showToast(
        'Despesa bancária detectada!',
        `"${parsed.description}" lançada automaticamente com sucesso.`,
        'success'
      );
    } else {
      setPendingBankTransactions(prev => {
        if (prev.some(p => p.hash === parsed.hash)) return prev;
        const next = [parsed, ...prev];
        savePendingBankTransactions(next);
        return next;
      });
      setIsPendingBankModalOpen(true);
    }
  };

  const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newId = `card-${Date.now()}`;
    const newCard: CreditCard = { ...cardData, id: newId };

    const now = new Date();
    const monthsFull = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = `${monthsFull[now.getMonth()]} ${now.getFullYear()}`;
    const monthPad = String(now.getMonth() + 1).padStart(2, '0');

    const newInvoice: Invoice = {
      id: `inv-${newId}-${now.getMonth() + 1}`,
      cardId: newId,
      month: monthName,
      closingDate: `${now.getFullYear()}-${monthPad}-${cardData.closingDay.toString().padStart(2, '0')}`,
      dueDate: `${now.getFullYear()}-${monthPad}-${cardData.dueDay.toString().padStart(2, '0')}`,
      status: 'open',
    };

    setCards(prev => [...prev, newCard]);
    setInvoices(prev => [...prev, newInvoice]);
    showToast('Cartão adicionado com sucesso.', `${newCard.name} pronto para uso.`, 'success');
  };

  const handleUpdateCard = (cardId: string, cardData: Omit<CreditCard, 'id'>) => {
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, ...cardData } : c)));
    showToast('Cartão atualizado.', 'As alterações foram salvas com sucesso.', 'success');
  };

  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = cards.find(c => c.id === cardId);
    setCards(prev => prev.filter(c => c.id !== cardId));
    setCardPurchases(prev => prev.filter(p => p.cardId !== cardId));
    setInvoices(prev => prev.filter(i => i.cardId !== cardId));
    showToast('Cartão excluído.', `${cardToDelete?.name || 'Cartão'} removido.`, 'info');
  };

  const handlePayInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    const card = cards.find(c => c.id === invoice.cardId);
    const invoicePurchases = cardPurchases.filter(p => p.cardId === invoice.cardId);
    const invoiceTotal = invoicePurchases.reduce((acc, p) => acc + p.amount, 0);

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
          : inv
      )
    );

    if (invoiceTotal > 0) {
      await handleAddTransaction({
        description: `Pagamento Fatura ${card ? card.name : 'Cartão'}`,
        amount: Math.round(invoiceTotal * 100) / 100,
        type: 'expense',
        categoryId: categories[0]?.id || 'outros',
        date: new Date().toLocaleDateString('en-CA'),
        paymentMethod: 'cash',
      });
    }

    setCardPurchases(prev => prev.filter(p => p.cardId !== invoice.cardId));

    showToast(
      'Fatura marcada como paga.',
      `Limite do ${card?.name || 'cartão'} restabelecido e débito lançado no saldo.`,
      'success'
    );
  };

  const handleOpenAddModal = (type: TransactionType = 'expense', customDate?: string) => {
    setTransactionToEdit(null);
    setAddModalInitialType(type);
    setAddModalInitialDate(customDate || new Date().toLocaleDateString('en-CA'));
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setAddModalInitialType(tx.type);
    setIsAddModalOpen(true);
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    try {
      let targetCategoryId = updatedTx.categoryId;
      const matchedCategory = categories.find(c => c.id === targetCategoryId);
      if (!matchedCategory && categories.length > 0) {
        targetCategoryId = categories[0].id;
      }

      try {
        await updateTransaction(dataConnect, {
          id: updatedTx.id,
          description: updatedTx.description,
          amount: updatedTx.amount,
          type: updatedTx.type,
          categoryId: targetCategoryId,
          date: updatedTx.date,
          status: updatedTx.status || 'completed',
          account: updatedTx.account || null,
          paymentMethod: updatedTx.paymentMethod || null,
          observation: updatedTx.observation || null,
        });
        await loadDataConnectData();
      } catch (dcErr) {
        console.warn('Data Connect update fallback:', dcErr);
        setTransactions(prev => {
          const updated = prev.map(t => (t.id === updatedTx.id ? updatedTx : t));
          if (user) localStorage.setItem(`@saldo_${user.uid}_transactions`, JSON.stringify(updated));
          return updated;
        });
      }

      showToast('Movimentação atualizada.', `${updatedTx.description} foi alterada.`, 'success');
    } catch (error) {
      console.error('Error updating transaction:', error);
      showToast('Erro ao atualizar movimentação', 'Tente novamente.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    try {
      try {
        await deleteTransaction(dataConnect, { id });
        await loadDataConnectData();
      } catch (dcErr) {
        console.warn('Data Connect delete fallback:', dcErr);
        setTransactions(prev => {
          const updated = prev.filter(t => t.id !== id);
          if (user) localStorage.setItem(`@saldo_${user.uid}_transactions`, JSON.stringify(updated));
          return updated;
        });
      }
      showToast('Movimentação excluída.', `${tx?.description || 'Item'} removido com sucesso.`, 'info');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Erro ao excluir movimentação', 'Tente novamente.', 'error');
    }
  };

  const handleUpdateMonthlyLimit = (newLimit: number) => {
    setBudget({ monthlyLimit: newLimit });
  };

  const handleSaveCategoryBudget = (budgetData: {
    id?: string;
    categoryId: string;
    limit: number;
    spent: number;
    observation?: string;
  }) => {
    if (budgetData.id) {
      setCategoryBudgets(prev =>
        prev.map(item =>
          item.id === budgetData.id
            ? {
                ...item,
                categoryId: budgetData.categoryId,
                limit: budgetData.limit,
                spent: budgetData.spent,
                observation: budgetData.observation,
              }
            : item
        )
      );
    } else {
      const newBudget: CategoryBudget = {
        id: `cb-${Date.now()}`,
        categoryId: budgetData.categoryId,
        limit: budgetData.limit,
        spent: budgetData.spent,
        observation: budgetData.observation,
      };
      setCategoryBudgets(prev => [...prev, newBudget]);
    }
  };

  const handleSaveGoal = (goalData: Omit<FinancialGoal, 'id'> & { id?: string }) => {
    if (goalData.id) {
      setGoals(prev =>
        prev.map(g => (g.id === goalData.id ? ({ ...g, ...goalData } as FinancialGoal) : g))
      );
    } else {
      const newGoal: FinancialGoal = {
        ...goalData,
        id: `goal-${Date.now()}`,
      };
      setGoals(prev => [...prev, newGoal]);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleSaveAccount = (accountToSave: AccountWallet, isNew: boolean, oldName?: string) => {
    if (isNew) {
      setAccounts(prev => [...prev, accountToSave]);
    } else {
      setAccounts(prev => prev.map(a => (a.id === accountToSave.id ? accountToSave : a)));
      if (oldName && oldName.trim().toLowerCase() !== accountToSave.name.trim().toLowerCase()) {
        setTransactions(prev => {
          const updated = prev.map(t => {
            if (t.account && t.account.trim().toLowerCase() === oldName.trim().toLowerCase()) {
              return { ...t, account: accountToSave.name };
            }
            return t;
          });
          if (user) localStorage.setItem(`@saldo_${user.uid}_transactions`, JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  // Notificações ativas geradas com base no estado financeiro atual
  const activeNotifications: AppNotification[] = useMemo(() => {
    const generated = generateContextualNotifications(
      transactions,
      budget,
      upcomingBills,
      goals,
      accounts,
      notificationSettings,
      dismissedNotificationIds
    );
    return generated.map(n => ({
      ...n,
      read: readNotificationIds.includes(n.id),
    }));
  }, [
    transactions,
    budget,
    upcomingBills,
    goals,
    accounts,
    notificationSettings,
    dismissedNotificationIds,
    readNotificationIds,
  ]);

  const unreadNotifsCount = useMemo(() => {
    return activeNotifications.filter(n => !n.read).length;
  }, [activeNotifications]);

  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setReadNotificationIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleMarkAllNotificationsAsRead = () => {
    const allIds = activeNotifications.map(n => n.id);
    setReadNotificationIds(prev => Array.from(new Set([...prev, ...allIds])));
    showToast('Avisos lidos', 'Todas as notificações foram marcadas como lidas.', 'info');
  };

  const handleClearAllNotifications = () => {
    const allIds = activeNotifications.map(n => n.id);
    setDismissedNotificationIds(prev => Array.from(new Set([...prev, ...allIds])));
    showToast('Avisos limpos', 'Todas as notificações foram removidas.', 'info');
  };

  const handleDeleteNotification = (id: string) => {
    setDismissedNotificationIds(prev => [...prev, id]);
  };

  // Bloqueio automático por inatividade
  useEffect(() => {
    if (!user || !securitySettings.pinEnabled || securitySettings.autoLockTimeout === 'disabled') {
      return;
    }

    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (securitySettings.autoLockTimeout === 'immediate') {
          setIsAppLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (isAppLocked) return;

      const elapsed = Date.now() - lastActivity;
      if (securitySettings.autoLockTimeout === '1min' && elapsed >= 60000) {
        setIsAppLocked(true);
      } else if (securitySettings.autoLockTimeout === '5min' && elapsed >= 300000) {
        setIsAppLocked(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('click', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user, securitySettings.pinEnabled, securitySettings.autoLockTimeout, isAppLocked]);

  const handleUpdateSecuritySettings = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
    if (newSettings.startWithHiddenBalance && !isHidden) {
      setIsHidden(true);
    }
  };

  const handleLockNow = () => {
    if (securitySettings.pinEnabled) {
      setIsAppLocked(true);
      showToast('Aplicativo bloqueado', 'Digite seu PIN para desbloquear.', 'info');
    } else {
      showToast('PIN não configurado', 'Ative o bloqueio por PIN primeiro.', 'warning');
    }
  };

  const handleUpdateGeneralPreferences = (updated: GeneralPreferences) => {
    setGeneralPreferences(updated);
    setGlobalCurrency(updated.currency);
    setGlobalDateFormat(updated.dateFormat);
  };

  const handleResetData = () => {
    if (!user) return;
    const uid = user.uid;
    clearAllMemoryState();
    localStorage.removeItem(`@saldo_${uid}_transactions`);
    localStorage.removeItem(`@saldo_${uid}_cards`);
    localStorage.removeItem(`@saldo_${uid}_invoices`);
    localStorage.removeItem(`@saldo_${uid}_purchases`);
    localStorage.removeItem(`@saldo_${uid}_accounts`);
    localStorage.removeItem(`@saldo_${uid}_budget`);
    localStorage.removeItem(`@saldo_${uid}_cat_budgets`);
    localStorage.removeItem(`@saldo_${uid}_goals`);
    localStorage.removeItem(`@saldo_${uid}_upcoming_bills`);
    activeUidRef.current = uid;
    showToast('Dados redefinidos', 'Todos os lançamentos e configurações foram limpos.', 'info');
  };

  const handleSignOut = async () => {
    clearAllMemoryState();
    await signOut(auth);
  };



  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return calculateFinancialSummary(transactions);
  }, [transactions]);

  const handleViewAllBills = () => {
    showToast('Contas a pagar', 'Gerenciamento de faturas disponível na aba Cartões.', 'info');
  };

  const handleViewAllTransactions = () => {
    setCurrentTab('transactions');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      } else if (authMode === 'register') {
        if (authPassword !== authConfirmPassword) {
          setAuthError('As senhas não coincidem.');
          setIsSubmitting(false);
          return;
        }
        if (authPassword.length < 6) {
          setAuthError('A senha deve ter no mínimo 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        if (authName.trim()) {
          try {
            await updateProfile(cred.user, { displayName: authName.trim() });
          } catch (_) {}
          setUserProfile({
            name: authName.trim(),
            email: cred.user.email || authEmail.trim(),
          });
        }
      } else if (authMode === 'forgot') {
        if (!authEmail.trim()) {
          setAuthError('Informe o seu e-mail.');
          setIsSubmitting(false);
          return;
        }
        await sendPasswordResetEmail(auth, authEmail.trim());
        setAuthSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('E-mail inválido. Verifique o formato.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Senha muito fraca. Digite ao menos 6 dígitos.');
      } else {
        setAuthError(err?.message || 'Falha na autenticação. Verifique os dados.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aplicação Principal MeuBolso - Inicializa diretamente a tela principal com todas as suas movimentações e carteira
  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col items-center justify-start antialiased font-sans">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <main className="w-full max-w-md min-h-screen flex flex-col bg-[#090a0f] border-x border-zinc-900 shadow-2xl relative pb-28">
        <Header
          userName={userProfile.name || activeUser.displayName || 'MeuBolso'}
          userEmail={userProfile.email || activeUser.email || ''}
          currentMonth={currentMonthStr}
          isHidden={isHidden}
          onToggleHide={handleToggleHide}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          unreadNotificationsCount={unreadNotifsCount}
          onOpenExport={() => setIsExportModalOpen(true)}
        />

        {currentTab === 'transactions' ? (
          <div className="px-4 pt-1">
            <TransactionsScreen
              transactions={transactions}
              cards={cards}
              categories={categories}
              accounts={accounts}
              isHidden={isHidden}
              uiStatus={transactionsUiStatus}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onRetry={() => {
                loadDataConnectData();
              }}
            />
          </div>
        ) : currentTab === 'planning' ? (
          <div className="px-4 pt-1">
            <PlanningScreen
              categories={categories}
              transactions={transactions}
              monthlyLimit={budget.monthlyLimit}
              categoryBudgets={categoryBudgets}
              goals={goals}
              isHidden={isHidden}
              onUpdateMonthlyLimit={handleUpdateMonthlyLimit}
              onSaveCategoryBudget={handleSaveCategoryBudget}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onShowToast={showToast}
            />
          </div>
        ) : currentTab === 'more' ? (
          <div className="px-4 pt-1">
            <MoreScreen
              userName={userProfile.name || user?.displayName || (user?.email ? user.email.split('@')[0] : '')}
              userEmail={userProfile.email || user?.email || ''}
              onNavigateTab={tab => setCurrentTab(tab)}
              onOpenAccounts={() => setIsAccountsModalOpen(true)}
              onOpenNotifications={() => setIsNotificationsModalOpen(true)}
              onOpenBankSettings={() => setIsSettingsModalOpen(true)}
              onOpenSecurity={() => setIsSecurityModalOpen(true)}
              onOpenPreferences={() => setIsPreferencesModalOpen(true)}
              currentPreferences={generalPreferences}
              onShowToast={showToast}
              onUpdateProfile={updated => setUserProfile(prev => ({ ...prev, ...updated }))}
              onSignOut={handleSignOut}
            />
          </div>
        ) : currentTab !== 'home' ? (
          <ProvisionalView tab={currentTab} onReturnHome={() => setCurrentTab('home')} />
        ) : (
          <div className="px-4 flex flex-col gap-4.5 pt-1">
            {pendingBankTransactions.length > 0 && pendingBankTransactions[0] && (
              <div className="flex items-center justify-between p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <BellRing size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {pendingBankTransactions.length} movimentação{pendingBankTransactions.length > 1 ? 'ões' : ''} bancária{pendingBankTransactions.length > 1 ? 's' : ''} detectada{pendingBankTransactions.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {pendingBankTransactions[0].bankName || 'Banco'}: {pendingBankTransactions[0].description || 'Movimentação'} ({pendingBankTransactions[0].type === 'income' ? '+' : '-'}R$ {(Number(pendingBankTransactions[0].amount) || 0).toFixed(2)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPendingBankModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 ml-2 shadow transition-colors cursor-pointer"
                >
                  Revisar
                </button>
              </div>
            )}
            {transactions.length === 0 ? (
              <div className="flex flex-col gap-4.5">
                <BalanceCard
                  balance={0}
                  totalIncome={0}
                  totalExpense={0}
                  isHidden={isHidden}
                  onOpenAccounts={() => setIsAccountsModalOpen(true)}
                />
                <EmptyStateView onAddTransaction={() => handleOpenAddModal('expense')} />
              </div>
            ) : (
              <>
                <BalanceCard
                  balance={balance}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  isHidden={isHidden}
                  onOpenAccounts={() => setIsAccountsModalOpen(true)}
                />

                <SummaryCards
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  isHidden={isHidden}
                />

                <BudgetLimitCard
                  totalExpense={totalExpense}
                  monthlyLimit={budget.monthlyLimit}
                  isHidden={isHidden}
                />

                <ContextualInsight
                  transactions={transactions}
                  monthlyLimit={budget.monthlyLimit}
                  upcomingBills={upcomingBills}
                  isHidden={isHidden}
                />

                <ExpenseChart transactions={transactions} isHidden={isHidden} />

                <UpcomingBills
                  bills={upcomingBills}
                  isHidden={isHidden}
                  onViewAll={handleViewAllBills}
                />

                <RecentTransactions
                  transactions={transactions}
                  isHidden={isHidden}
                  onViewAll={handleViewAllTransactions}
                  onOpenAddModal={() => handleOpenAddModal('expense')}
                />
              </>
            )}
          </div>
        )}

        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          onOpenAddModal={type => handleOpenAddModal(type)}
        />

        <AddTransactionModal
          isOpen={isAddModalOpen}
          initialType={addModalInitialType}
          initialDate={addModalInitialDate}
          transactionToEdit={transactionToEdit}
          cards={cards}
          categories={categories}
          accounts={accounts}
          onOpenAccounts={() => setIsAccountsModalOpen(true)}
          hapticFeedbackEnabled={generalPreferences.hapticFeedbackEnabled}
          onClose={() => {
            setIsAddModalOpen(false);
            setTransactionToEdit(null);
          }}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onShowToast={showToast}
        />

        <AccountsModal
          isOpen={isAccountsModalOpen}
          onClose={() => setIsAccountsModalOpen(false)}
          accounts={accounts}
          transactions={transactions}
          isHidden={isHidden}
          onSaveAccount={handleSaveAccount}
          onDeleteAccount={handleDeleteAccount}
          onShowToast={showToast}
        />

        <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          settings={notificationSettings}
          onUpdateSettings={handleUpdateNotificationSettings}
          notifications={activeNotifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAll={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
          onShowToast={showToast}
        />

        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          settings={securitySettings}
          onUpdateSettings={handleUpdateSecuritySettings}
          userEmail={userProfile.email}
          onLockNow={handleLockNow}
          onShowToast={showToast}
        />

        <PreferencesModal
          isOpen={isPreferencesModalOpen}
          onClose={() => setIsPreferencesModalOpen(false)}
          preferences={generalPreferences}
          onUpdatePreferences={handleUpdateGeneralPreferences}
          onShowToast={showToast}
        />

        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          transactions={transactions}
          categories={categories}
          userName={userProfile.name || user?.displayName || (user?.email ? user.email.split('@')[0] : '')}
          userEmail={userProfile.email || user?.email || ''}
          currentMonthName={currentMonthStr}
          onShowToast={showToast}
        />

        <PendingTransactionsModal
          isOpen={isPendingBankModalOpen}
          onClose={() => setIsPendingBankModalOpen(false)}
          pendingList={pendingBankTransactions}
          categories={categories}
          accounts={accounts}
          onConfirmTransaction={handleConfirmPendingBankTx}
          onDiscardTransaction={handleDiscardPendingBankTx}
          onDiscardAll={handleDiscardAllPendingBankTx}
          onShowToast={showToast}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onShowToast={showToast}
          onSimulatedTransaction={handleIncomingSimulatedBankTx}
        />

        <LockScreen
          isLocked={isAppLocked}
          onUnlock={() => setIsAppLocked(false)}
          correctPin={securitySettings.pinHash || ''}
          biometricsEnabled={securitySettings.biometricsEnabled}
          userName={userProfile.name || user?.displayName || (user?.email ? user.email.split('@')[0] : '')}
          onSignOut={handleSignOut}
          onShowToast={showToast}
        />
      </main>
    </div>
  );
}
