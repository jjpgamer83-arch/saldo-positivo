import { Category, Transaction, UpcomingBill, Budget, CategoryBudget, FinancialGoal, AccountWallet } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'moradia',
    name: 'Moradia',
    icon: 'Home',
    color: '#6366F1', // indigo
    bgLight: 'rgba(99, 102, 241, 0.12)',
    type: 'expense',
  },
  {
    id: 'alimentacao',
    name: 'Alimentação',
    icon: 'Utensils',
    color: '#10B981', // emerald
    bgLight: 'rgba(16, 185, 129, 0.12)',
    type: 'expense',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: 'Car',
    color: '#06B6D4', // cyan
    bgLight: 'rgba(6, 182, 212, 0.12)',
    type: 'expense',
  },
  {
    id: 'lazer',
    name: 'Lazer',
    icon: 'Compass',
    color: '#8B5CF6', // violet
    bgLight: 'rgba(139, 92, 246, 0.12)',
    type: 'expense',
  },
  {
    id: 'assinaturas',
    name: 'Assinaturas',
    icon: 'Tv',
    color: '#F43F5E', // rose
    bgLight: 'rgba(244, 63, 94, 0.12)',
    type: 'expense',
  },
  {
    id: 'outros',
    name: 'Outros',
    icon: 'Package',
    color: '#94A3B8', // slate
    bgLight: 'rgba(148, 163, 184, 0.12)',
    type: 'expense',
  },
  {
    id: 'salario',
    name: 'Salário',
    icon: 'Briefcase',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    type: 'income',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: 'Laptop',
    color: '#14B8A6',
    bgLight: 'rgba(20, 184, 166, 0.12)',
    type: 'income',
  },
  {
    id: 'investimentos',
    name: 'Investimentos',
    icon: 'TrendingUp',
    color: '#3B82F6',
    bgLight: 'rgba(59, 130, 246, 0.12)',
    type: 'income',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_UPCOMING_BILLS: UpcomingBill[] = [];

export const INITIAL_BUDGET: Budget = {
  monthlyLimit: 0,
};

export const INITIAL_CATEGORY_BUDGETS: CategoryBudget[] = [];

export const INITIAL_FINANCIAL_GOALS: FinancialGoal[] = [];

export const INITIAL_ACCOUNTS: AccountWallet[] = [];

