import {
  RawBankNotification,
  ParsedBankTransaction,
  BankDetectionSettings,
  PaymentMethod,
  TransactionType,
} from '../types';

export interface BankInfo {
  packageName: string;
  name: string;
  shortName: string;
  color: string;
}

export const SUPPORTED_BANKS: Record<string, BankInfo> = {
  'com.nu.production': {
    packageName: 'com.nu.production',
    name: 'Nubank',
    shortName: 'Nu',
    color: '#820AD1',
  },
  'com.itau': {
    packageName: 'com.itau',
    name: 'Banco Itaú',
    shortName: 'Itaú',
    color: '#EC7000',
  },
  'br.com.bb.android': {
    packageName: 'br.com.bb.android',
    name: 'Banco do Brasil',
    shortName: 'BB',
    color: '#FBF000',
  },
  'com.bradesco': {
    packageName: 'com.bradesco',
    name: 'Banco Bradesco',
    shortName: 'Bradesco',
    color: '#CC092F',
  },
  'com.intermedium': {
    packageName: 'com.intermedium',
    name: 'Banco Inter',
    shortName: 'Inter',
    color: '#FF7A00',
  },
  'com.santander.app': {
    packageName: 'com.santander.app',
    name: 'Banco Santander',
    shortName: 'Santander',
    color: '#EC0000',
  },
  'com.mercadopago.wallet': {
    packageName: 'com.mercadopago.wallet',
    name: 'Mercado Pago',
    shortName: 'MP',
    color: '#009EE3',
  },
  'br.com.c6bank.app': {
    packageName: 'br.com.c6bank.app',
    name: 'C6 Bank',
    shortName: 'C6',
    color: '#242424',
  },
  'br.com.gabba.caixa': {
    packageName: 'br.com.gabba.caixa',
    name: 'Caixa Econômica',
    shortName: 'Caixa',
    color: '#005CA9',
  },
  'com.picpay': {
    packageName: 'com.picpay',
    name: 'PicPay',
    shortName: 'PicPay',
    color: '#11C76F',
  },
};

export const DEFAULT_BANK_DETECTION_SETTINGS: BankDetectionSettings = {
  enabled: true,
  autoApproveHighConfidence: false, // Por segurança, pede confirmação rápida por padrão
  notifyOnDetection: true,
  whitelistedBanks: Object.keys(SUPPORTED_BANKS),
};

const STORAGE_KEY_SETTINGS = '@saldo_bank_detection_settings';
const STORAGE_KEY_HASHES = '@saldo_processed_bank_notification_hashes';
const STORAGE_KEY_PENDING = '@saldo_pending_bank_transactions';

// Carrega configurações salvas ou padrão
export function getBankDetectionSettings(): BankDetectionSettings {
  if (typeof window === 'undefined') return DEFAULT_BANK_DETECTION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_BANK_DETECTION_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BANK_DETECTION_SETTINGS,
      ...parsed,
      whitelistedBanks: Array.isArray(parsed?.whitelistedBanks)
        ? parsed.whitelistedBanks
        : DEFAULT_BANK_DETECTION_SETTINGS.whitelistedBanks,
    };
  } catch {
    return DEFAULT_BANK_DETECTION_SETTINGS;
  }
}

export function saveBankDetectionSettings(settings: BankDetectionSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Falha ao salvar configurações de detecção bancária:', err);
  }
}

// ==========================================
// HASH E DEDUPLICAÇÃO ANTI-DUPLICIDADE (SHA-256)
// ==========================================

export async function generateNotificationHash(
  packageName: string,
  amount: number,
  dateStr: string,
  description: string
): Promise<string> {
  const normDesc = description.trim().toLowerCase().slice(0, 30);
  const rawString = `${packageName}|${amount.toFixed(2)}|${dateStr}|${normDesc}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(rawString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } catch {
      // Fallback abaixo
    }
  }

  // Fallback rápido se subtleCrypto não estiver disponível
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

export function isNotificationAlreadyProcessed(hash: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HASHES);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(hash);
  } catch {
    return false;
  }
}

export function markNotificationAsProcessed(hash: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HASHES);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(hash)) {
      // Mantém os últimos 500 hashes para economizar memória e evitar duplicatas
      const updated = [hash, ...list].slice(0, 500);
      localStorage.setItem(STORAGE_KEY_HASHES, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Erro ao marcar hash de notificação:', err);
  }
}

// ==========================================
// FILA DE TRANSAÇÕES PENDENTES DE CONFIRMAÇÃO
// ==========================================

export function getPendingBankTransactions(): ParsedBankTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(item => (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.amount === 'number' &&
      !isNaN(item.amount) &&
      typeof item.description === 'string'
    )).map(item => ({
      ...item,
      bankName: item.bankName || 'Banco',
      confidence: item.confidence || 'medium',
      suggestedCategoryId: item.suggestedCategoryId || 'outros',
      date: item.date || new Date().toISOString().split('T')[0],
      paymentMethod: item.paymentMethod || 'pix',
      type: item.type === 'income' ? 'income' : 'expense',
      rawText: item.rawText || item.description || '',
    }));
  } catch {
    return [];
  }
}

export function savePendingBankTransactions(list: ParsedBankTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(list));
  } catch (err) {
    console.error('Erro ao salvar transações bancárias pendentes:', err);
  }
}

export function removePendingBankTransaction(id: string): void {
  const current = getPendingBankTransactions();
  const filtered = current.filter(item => item.id !== id);
  savePendingBankTransactions(filtered);
}

// ==========================================
// PARSER REGEX INTELIGENTE EM PT-BR
// ==========================================

export async function parseBankNotification(
  notification: RawBankNotification
): Promise<ParsedBankTransaction | null> {
  const fullText = `${notification.title || ''} ${notification.text || ''} ${notification.bigText || ''}`.trim();
  if (!fullText) return null;

  // 1. Extração do Valor Monetário (R$)
  // Suporta R$ 1.250,50 ou R$ 45,90 ou R$45.90 ou 'valor de R$ 99,00'
  const amountRegex = /(?:R\$\s*|valor\s*(?:de)?\s*R\$\s*)([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})/i;
  const amountMatch = fullText.match(amountRegex);

  let amount = 0;
  if (amountMatch && amountMatch[1]) {
    const rawAmountStr = amountMatch[1];
    // Normaliza para float JS: remove pontos de milhar e troca vírgula por ponto
    const normalized = rawAmountStr.replace(/\./g, '').replace(',', '.');
    amount = parseFloat(normalized);
  } else {
    // Procura número solto se precedido por palavras-chave bancárias
    const fallbackMatch = /(?:compra|transferência|pix|pagamento|recebido|transferiu|débito|crédito)\D*?(\d{1,5}[.,]\d{2})/i.exec(fullText);
    if (fallbackMatch && fallbackMatch[1]) {
      const normalized = fallbackMatch[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(normalized);
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    // Se não encontrou valor monetário válido, não é uma notificação transacional
    return null;
  }

  // 2. Determinação de Tipo (Despesa vs Receita)
  const lower = fullText.toLowerCase();
  const isIncome = /(recebeu|recebido|creditado|transferência recebida|reembolso|salário|depósito recebido|te enviou)/i.test(lower);
  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 3. Determinação do Método de Pagamento
  let paymentMethod: PaymentMethod = 'pix';
  if (/\bpix\b/i.test(lower)) {
    paymentMethod = 'pix';
  } else if (/crédito|fatura|cartão de crédito/i.test(lower)) {
    paymentMethod = 'credit_card';
  } else if (/débito|cartão de débito/i.test(lower)) {
    paymentMethod = 'debit';
  } else if (/boleto|código de barras/i.test(lower)) {
    paymentMethod = 'boleto';
  } else if (/transferência|ted|doc/i.test(lower)) {
    paymentMethod = 'transfer';
  }

  // 4. Extração da Descrição / Estabelecimento / Destinatário
  let description = '';
  const bankInfo = SUPPORTED_BANKS[notification.packageName];
  const bankDisplayName = bankInfo ? bankInfo.shortName : notification.bankName || 'Banco';

  // Padrão "em [ESTABELECIMENTO]" ou "no [ESTABELECIMENTO]"
  const merchantMatch = /(?:em\s+|no\(a\)\s+|no\s+|na\s+)([A-Za-z0-9\s*.\-_]{2,35})(?:\s*[-–.]|\s*via|\s*com|\s*às|\s*no valor|$)/i.exec(fullText);
  // Padrão "para [PESSOA/EMPRESA]"
  const recipientMatch = /(?:para\s+)([A-Za-z0-9\s*.\-_]{2,35})(?:\s*[-–.]|\s*via|\s*no valor|\s*chave|$)/i.exec(fullText);
  // Padrão "de [PESSOA/EMPRESA]"
  const senderMatch = /(?:de\s+)([A-Za-z0-9\s*.\-_]{2,35})(?:\s*[-–.]|\s*via|\s*no valor|$)/i.exec(fullText);

  if (isIncome && senderMatch && senderMatch[1]) {
    description = `Pix de ${cleanMerchantName(senderMatch[1])}`;
  } else if (merchantMatch && merchantMatch[1]) {
    description = cleanMerchantName(merchantMatch[1]);
  } else if (recipientMatch && recipientMatch[1]) {
    description = `${paymentMethod === 'pix' ? 'Pix para' : 'Pagamento a'} ${cleanMerchantName(recipientMatch[1])}`;
  } else if (notification.title && !notification.title.toLowerCase().includes(bankDisplayName.toLowerCase())) {
    description = cleanMerchantName(notification.title);
  } else {
    description = isIncome ? `Receita via ${bankDisplayName}` : `Despesa via ${bankDisplayName}`;
  }

  // 5. Sugestão de Categoria com base em palavras-chave no texto
  const suggestedCategoryId = suggestCategory(description, fullText, type);

  // 6. Data da Notificação no formato YYYY-MM-DD
  const dateObj = notification.timestamp ? new Date(notification.timestamp) : new Date();
  const dateStr = dateObj.toISOString().split('T')[0];

  // 7. Cálculo de Confiança e Ambiguidade
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let isAmbiguous = false;

  // Palavras que indicam dúvida ou ações que não são compras confirmadas
  if (/(estorno|cancelad|análise|agendad|recusad|falha|bloquead|pré-autorizad|aprovação)/i.test(lower)) {
    confidence = 'low';
    isAmbiguous = true;
  } else if (description.startsWith('Despesa via') || description.startsWith('Receita via')) {
    confidence = 'medium';
    isAmbiguous = true;
  }

  // 8. Hash para deduplicação
  const hash = await generateNotificationHash(notification.packageName, amount, dateStr, description);

  return {
    id: `bank-tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    rawNotificationId: notification.id,
    packageName: notification.packageName,
    bankName: bankDisplayName,
    description,
    amount,
    type,
    date: dateStr,
    paymentMethod,
    suggestedCategoryId,
    confidence,
    isAmbiguous,
    rawText: fullText,
    timestamp: notification.timestamp || Date.now(),
    hash,
  };
}

function cleanMerchantName(raw: string): string {
  let cleaned = raw
    .replace(/(?:R\$\s*[\d.,]+|via\s+\w+|às\s+[\d:]+|no valor de.*)/gi, '')
    .trim();
  // Limita tamanho
  if (cleaned.length > 35) cleaned = cleaned.slice(0, 35).trim();
  // Capitaliza primeira letra de cada palavra
  return cleaned
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function suggestCategory(description: string, fullText: string, type: TransactionType): string {
  if (type === 'income') {
    return 'salario';
  }

  const text = `${description} ${fullText}`.toLowerCase();

  // Alimentação
  if (/(mercado|supermercado|padaria|ifood|restaurante|burger|lanche|acougue|hortifruti|cafe|starbucks|pizza|churrascaria|rappi|ze delivery)/i.test(text)) {
    return 'alimentacao';
  }
  // Transporte
  if (/(uber|99|posto|gasolina|combustivel|estacionamento|pedagio|onibus|metro|shell|ipiranga|sem parar|veloe)/i.test(text)) {
    return 'transporte';
  }
  // Moradia / Contas
  if (/(aluguel|condominio|enel|cpfl|sabesp|copasa|cemig|energia|agua|gas|iptu|internet|claro|vivo|tim)/i.test(text)) {
    return 'moradia';
  }
  // Assinaturas e Streaming
  if (/(netflix|spotify|amazon prime|hbo|disney|globo|youtube|apple|google play|deezer|paramount|crunchyroll)/i.test(text)) {
    return 'assinaturas';
  }
  // Lazer
  if (/(cinema|teatro|show|jogos|steam|playstation|xbox|bar|viagem|hotel|airbnb|decolar|ingresso)/i.test(text)) {
    return 'lazer';
  }

  return 'outros';
}

// ==========================================
// CAPACITOR NATIVE BRIDGE & FALLBACK WEB
// ==========================================

export interface BankNotificationPluginInterface {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<void>;
  getPendingNotifications(): Promise<{ notifications: RawBankNotification[] }>;
  clearNotification(options: { id: string }): Promise<void>;
}

// Declaração global para TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: {
        BankNotificationPlugin?: BankNotificationPluginInterface;
      };
    };
  }
}

export function isCapacitorNative(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.());
}

export async function checkAndroidNotificationPermission(): Promise<boolean> {
  if (isCapacitorNative() && window.Capacitor?.Plugins?.BankNotificationPlugin) {
    try {
      const res = await window.Capacitor.Plugins.BankNotificationPlugin.checkPermission();
      return Boolean(res.granted);
    } catch (err) {
      console.warn('Erro ao verificar permissão do NotificationListener:', err);
      return false;
    }
  }
  // No navegador, simula com base em flag local
  if (typeof window !== 'undefined') {
    return localStorage.getItem('@saldo_simulated_android_permission') === 'true';
  }
  return false;
}

export async function requestAndroidNotificationPermission(): Promise<void> {
  if (isCapacitorNative() && window.Capacitor?.Plugins?.BankNotificationPlugin) {
    try {
      await window.Capacitor.Plugins.BankNotificationPlugin.requestPermission();
      return;
    } catch (err) {
      console.warn('Erro ao chamar tela de permissão nativa:', err);
    }
  }

  // No navegador de desenvolvimento, abre modal explicativo ou ativa simulação
  if (typeof window !== 'undefined') {
    localStorage.setItem('@saldo_simulated_android_permission', 'true');
  }
}

// Dispara simulação para testes diretos no navegador
export async function simulateBankNotificationForTesting(sampleType: 'nubank_pix' | 'itau_debito' | 'inter_credit'): Promise<ParsedBankTransaction | null> {
  const samples: Record<string, RawBankNotification> = {
    nubank_pix: {
      id: `sim-${Date.now()}-1`,
      packageName: 'com.nu.production',
      bankName: 'Nubank',
      title: 'Transferência enviada',
      text: 'Você transferiu R$ 64,50 para Supermercado Pão de Açúcar via Pix.',
      timestamp: Date.now(),
    },
    itau_debito: {
      id: `sim-${Date.now()}-2`,
      packageName: 'com.itau',
      bankName: 'Itaú',
      title: 'Compra com cartão de débito aprovada',
      text: 'Compra aprovada de R$ 38,90 em PADARIA CENTRAL no seu cartão final 4892.',
      timestamp: Date.now(),
    },
    inter_credit: {
      id: `sim-${Date.now()}-3`,
      packageName: 'com.intermedium',
      bankName: 'Banco Inter',
      title: 'Compra no crédito confirmada',
      text: 'Compra no cartão de crédito aprovada no valor de R$ 149,90 em POSTO SHELL.',
      timestamp: Date.now(),
    },
  };

  const sample = samples[sampleType];
  return parseBankNotification(sample);
}
