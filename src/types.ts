export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit' | 'cash' | 'transfer' | 'boleto';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  type: TransactionType | 'both';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  status?: 'completed' | 'pending';
  account?: string;
  paymentMethod?: PaymentMethod | string;
  cardId?: string;
  invoiceId?: string;
  observation?: string;
  metadata?: BankNotificationMetadata | Record<string, unknown>;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  dueDay: number;
  categoryId: string;
  status: 'pending' | 'paid';
}

export interface Budget {
  monthlyLimit: number;
}

export type TabType = 'home' | 'transactions' | 'planning' | 'more';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export type UIStatus = 'idle' | 'loading' | 'error' | 'empty';

export type CardBrand = 'Mastercard' | 'Visa' | 'Elo' | 'Amex' | 'Outra';

export type CardColorTheme = 'purple' | 'blue' | 'orange' | 'dark' | 'emerald';

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  lastFourDigits: string;
  brand: CardBrand;
  limit: number;
  closingDay: number;
  dueDay: number;
  colorTheme: CardColorTheme;
}

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  cardId: string;
  month: string; // e.g. 'Setembro 2026'
  closingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paidAt?: string;
}

export interface InstallmentInfo {
  currentInstallment: number;
  totalInstallments: number;
  installmentAmount: number;
  purchaseDate: string;
  nextInstallmentDate: string;
}

export interface CreditCardPurchase {
  id: string;
  cardId: string;
  invoiceId: string;
  description: string;
  amount: number; // amount in this invoice (e.g. 300.00)
  totalAmount: number; // total amount if installment (e.g. 3600.00)
  categoryId: string;
  date: string; // YYYY-MM-DD
  isInstallment: boolean;
  installmentInfo?: InstallmentInfo;
}

export interface CategoryBudget {
  id: string;
  categoryId: string;
  spent: number;
  limit: number;
  observation?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string; // e.g. "Dez/2026" or "2026-12-31"
  description?: string;
  color?: string;
  icon?: string;
}

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash';

export interface AccountWallet {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color?: string;
  icon?: string;
}

export interface NotificationSettings {
  limitWarning80: boolean;
  limitExceeded100: boolean;
  upcomingBillsReminder: boolean;
  billsDueToday: boolean;
  goalMilestones: boolean;
  lowBalanceWarning: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  category: 'limit' | 'bill' | 'goal' | 'balance';
  timestamp: string;
  read: boolean;
  createdAt: number;
}

export type AutoLockTimeout = 'immediate' | '1min' | '5min' | 'disabled';

export interface SecuritySettings {
  pinEnabled: boolean;
  pinHash?: string;
  biometricsEnabled: boolean;
  autoLockTimeout: AutoLockTimeout;
  startWithHiddenBalance: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type CurrencyCode = 'BRL' | 'USD' | 'EUR';
export type FirstDayOfWeek = 'sunday' | 'monday';
export type DateFormatOption = 'DD/MM/AAAA' | 'AAAA-MM-DD' | 'MM/DD/AAAA';

export interface GeneralPreferences {
  theme: ThemeMode;
  currency: CurrencyCode;
  firstDayOfWeek: FirstDayOfWeek;
  dateFormat: DateFormatOption;
  hapticFeedbackEnabled: boolean;
}

// ==========================================
// DETECÇÃO AUTOMÁTICA DE NOTIFICAÇÕES BANCÁRIAS
// ==========================================

export interface RawBankNotification {
  id: string;
  packageName: string;
  bankName: string;
  title: string;
  text: string;
  bigText?: string;
  timestamp: number; // timestamp em ms
}

export interface BankNotificationMetadata {
  rawNotificationId?: string;
  packageName?: string;
  bankName?: string;
  detectedHash?: string;
  isAutoDetected?: boolean;
  needsConfirmation?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  originalText?: string;
}

export interface ParsedBankTransaction {
  id: string;
  rawNotificationId: string;
  packageName: string;
  bankName: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  suggestedCategoryId: string;
  confidence: 'high' | 'medium' | 'low';
  isAmbiguous: boolean;
  rawText: string;
  timestamp: number;
  hash: string;
}

export interface BankDetectionSettings {
  enabled: boolean;
  autoApproveHighConfidence: boolean;
  notifyOnDetection: boolean;
  whitelistedBanks: string[];
}

