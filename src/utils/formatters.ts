import { Category, Transaction, CurrencyCode, DateFormatOption } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro (BRL)',
    locale: 'pt-BR',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (USD)',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro Europeu (EUR)',
    locale: 'de-DE',
  },
};

let activeCurrency: CurrencyCode = 'BRL';
let activeDateFormat: DateFormatOption = 'DD/MM/AAAA';

export function setGlobalCurrency(currency: CurrencyCode) {
  if (CURRENCY_CONFIGS[currency]) {
    activeCurrency = currency;
  }
}

export function getGlobalCurrency(): CurrencyCode {
  return activeCurrency;
}

export function getCurrencySymbol(code?: CurrencyCode): string {
  const c = code || activeCurrency;
  return CURRENCY_CONFIGS[c]?.symbol || 'R$';
}

export function setGlobalDateFormat(format: DateFormatOption) {
  if (format) {
    activeDateFormat = format;
  }
}

export function getGlobalDateFormat(): DateFormatOption {
  return activeDateFormat;
}

export function formatCurrency(value: number, isHidden = false, currencyCode?: CurrencyCode): string {
  if (isHidden) {
    return '••••••';
  }
  const code = currencyCode || activeCurrency;
  const config = CURRENCY_CONFIGS[code] || CURRENCY_CONFIGS.BRL;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number, isHidden = false, currencyCode?: CurrencyCode): string {
  if (isHidden) {
    return '••••';
  }
  const code = currencyCode || activeCurrency;
  const config = CURRENCY_CONFIGS[code] || CURRENCY_CONFIGS.BRL;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string, customFormat?: DateFormatOption): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const format = customFormat || activeDateFormat;

    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year);

    if (format === 'AAAA-MM-DD') {
      return `${yyyy}-${mm}-${dd}`;
    }
    if (format === 'MM/DD/AAAA') {
      return `${mm}/${dd}/${yyyy}`;
    }
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return dateStr;
  }
}

export function formatTransactionDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if today or yesterday relative to real current date
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${String(day).padStart(2, '0')} ${months[date.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

export function formatTransactionGroupDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);

    // Reference today relative to real current date
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    const monthsFull = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthsFull[month - 1];

    if (isToday) return `Hoje • ${String(day).padStart(2, '0')} de ${monthName}`;
    if (isYesterday) return `Ontem • ${String(day).padStart(2, '0')} de ${monthName}`;

    return `${String(day).padStart(2, '0')} de ${monthName}, ${year}`;
  } catch {
    return dateStr;
  }
}

export function getCategoryById(id: string, customCategories: Category[] = INITIAL_CATEGORIES): Category {
  const found = customCategories.find(c => c.id === id);
  if (found) return found;
  return {
    id: 'outros',
    name: 'Outros',
    icon: 'Package',
    color: '#94A3B8',
    bgLight: 'rgba(148, 163, 184, 0.12)',
    type: 'expense',
  };
}

export function calculateFinancialSummary(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    balance,
  };
}

export function calculateCategoryExpenses(transactions: Transaction[]) {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryMap = new Map<string, number>();

  expenseTransactions.forEach(tx => {
    const current = categoryMap.get(tx.categoryId) || 0;
    categoryMap.set(tx.categoryId, current + tx.amount);
  });

  const categoriesWithTotals = Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
    const category = getCategoryById(categoryId);
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return {
      category,
      amount,
      percentage,
    };
  });

  // Sort descending by amount
  return categoriesWithTotals.sort((a, b) => b.amount - a.amount);
}

/**
 * Calcula as iniciais do avatar dinamicamente com base no nome real ou no login/prefixo do e-mail:
 * - Se tiver nome e sobrenome (ex: 'Maria Silva'), pega a primeira letra de cada palavra em maiúsculas ('MS')
 * - Se for uma palavra só ou login de e-mail (ex: 'cocored2025'), pega as duas primeiras letras em maiúsculas ('CO')
 */
export function getUserInitials(name?: string, email?: string): string {
  const cleanName = name?.trim();
  const cleanEmail = email?.trim();

  let source = '';
  if (cleanName && cleanName.toLowerCase() !== 'usuário') {
    source = cleanName;
  } else if (cleanEmail) {
    source = cleanEmail.split('@')[0].trim();
  } else if (cleanName) {
    source = cleanName;
  }

  if (!source) {
    return 'US';
  }

  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  const single = words[0];
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }
  return single.toUpperCase();
}

/**
 * Retorna o nome apropriado para a saudação ('Olá, Maria' ou 'Olá, cocored2025')
 */
export function getUserGreetingName(name?: string, email?: string): string {
  const cleanName = name?.trim();
  const cleanEmail = email?.trim();

  if (cleanName && cleanName.toLowerCase() !== 'usuário') {
    return cleanName.split(/\s+/)[0];
  }
  if (cleanEmail) {
    return cleanEmail.split('@')[0];
  }
  return cleanName || 'Usuário';
}

export function getBudgetStatusColor(percentage: number) {
  if (percentage <= 60) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-400',
      border: 'border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    };
  }
  if (percentage <= 80) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-400',
      border: 'border-amber-500/20',
      badgeBg: 'bg-amber-500/10',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-500',
    border: 'border-rose-500/20',
    badgeBg: 'bg-rose-500/10',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
  };
}
