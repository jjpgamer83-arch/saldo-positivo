import { CreditCard, CreditCardPurchase, InvoiceStatus, InstallmentInfo } from '../types';

export function getCardUsedAmount(cardId: string, purchases: CreditCardPurchase[]): number {
  return purchases
    .filter(p => p.cardId === cardId)
    .reduce((acc, curr) => acc + curr.amount, 0);
}

export function getCardUtilizationPercentage(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export interface UtilizationStyle {
  label: string;
  textColor: string;
  bgColor: string;
  progressColor: string;
  glowColor: string;
}

export function getCardUtilizationStatus(percentage: number): UtilizationStyle {
  if (percentage <= 50) {
    return {
      label: 'Confortável',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      progressColor: 'bg-emerald-400',
      glowColor: 'shadow-emerald-500/20',
    };
  }
  if (percentage <= 75) {
    return {
      label: 'Moderado',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      progressColor: 'bg-amber-400',
      glowColor: 'shadow-amber-500/20',
    };
  }
  if (percentage <= 90) {
    return {
      label: 'Atenção',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      progressColor: 'bg-orange-500',
      glowColor: 'shadow-orange-500/20',
    };
  }
  return {
    label: 'Crítico',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    progressColor: 'bg-rose-500',
    glowColor: 'shadow-rose-500/20',
  };
}

export function calculateCardsSummary(cards: CreditCard[], purchases: CreditCardPurchase[]) {
  const totalLimit = cards.reduce((acc, card) => acc + card.limit, 0);
  const totalUsed = cards.reduce((acc, card) => acc + getCardUsedAmount(card.id, purchases), 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);

  return {
    totalLimit,
    totalUsed,
    totalAvailable,
    percentUsed: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0,
  };
}

export function getInvoiceStatusMeta(status: InvoiceStatus) {
  switch (status) {
    case 'open':
      return {
        label: 'Aberta',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dotColor: 'bg-indigo-400',
      };
    case 'closed':
      return {
        label: 'Fechada',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'paid':
      return {
        label: 'Paga',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    case 'overdue':
      return {
        label: 'Vencida',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotColor: 'bg-rose-400',
      };
  }
}

export function getDaysUntilClosingText(closingDay: number): { text: string; days: number } {
  const currentDay = new Date().getDate();
  let diff = closingDay - currentDay;
  if (diff < 0) {
    diff += 30;
  }

  if (diff === 0) {
    return { text: 'Fecha hoje!', days: 0 };
  }
  if (diff === 1) {
    return { text: 'Resta 1 dia para o fechamento', days: 1 };
  }
  if (diff <= 5) {
    return { text: `Restam ${diff} dias para o fechamento`, days: diff };
  }
  return { text: `Fecha em ${diff} dias`, days: diff };
}

export interface TimelineItem {
  number: number;
  monthName: string;
  amount: number;
  status: 'paid' | 'current' | 'upcoming';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function generateInstallmentTimeline(info: InstallmentInfo): TimelineItem[] {
  const items: TimelineItem[] = [];
  const startMonthIndex = 5; // Junho = 5

  for (let i = 1; i <= info.totalInstallments; i++) {
    const monthIndex = (startMonthIndex + (i - 1)) % 12;
    const monthName = MONTH_NAMES[monthIndex];

    let status: 'paid' | 'current' | 'upcoming' = 'upcoming';
    if (i < info.currentInstallment) {
      status = 'paid';
    } else if (i === info.currentInstallment) {
      status = 'current';
    }

    items.push({
      number: i,
      monthName,
      amount: info.installmentAmount,
      status,
    });
  }

  return items;
}
