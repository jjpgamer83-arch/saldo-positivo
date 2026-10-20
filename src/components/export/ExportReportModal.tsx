import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Transaction, Category } from '../../types';
import { formatCurrency, formatDate, getCategoryById } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';

export type ExportPeriod = 'current_month' | 'last_30_days' | 'all_time';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories?: Category[];
  userName?: string;
  userEmail?: string;
  currentMonthName?: string;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories = [],
  userName = 'Usuário',
  userEmail = '',
  currentMonthName = 'Mês Atual',
  onShowToast,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('current_month');
  const [showPreview, setShowPreview] = useState(false);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (selectedPeriod === 'current_month') {
      return transactions.filter(t => {
        try {
          const [y, m] = t.date.split('-').map(Number);
          return y === currentYear && m === currentMonth + 1;
        } catch {
          return true;
        }
      });
    }

    if (selectedPeriod === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const minDateStr = thirtyDaysAgo.toISOString().slice(0, 10);
      return transactions.filter(t => t.date >= minDateStr);
    }

    // All time
    return [...transactions];
  }, [transactions, selectedPeriod]);

  // Sort transactions descending by date
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  // Financial summary of the filtered period
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    sortedTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    return {
      totalIncome,
      totalExpense,
      balance,
      count: sortedTransactions.length,
    };
  }, [sortedTransactions]);

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'current_month':
        return `Mês Atual (${currentMonthName})`;
      case 'last_30_days':
        return 'Últimos 30 Dias';
      case 'all_time':
        return 'Todo o Histórico';
    }
  }, [selectedPeriod, currentMonthName]);

  // CSV Export Handler
  const handleDownloadCSV = () => {
    if (sortedTransactions.length === 0) {
      onShowToast('Nenhum dado', 'Não há transações no período selecionado para exportar.', 'warning');
      return;
    }

    try {
      triggerHaptic('success', true);

      // Semicolon separator with quotes for Excel in Portuguese/European locales
      const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor'];
      
      const rows = sortedTransactions.map(tx => {
        const cat = getCategoryById(tx.categoryId, categories);
        const dateStr = formatDate(tx.date);
        const descClean = (tx.description || '').replace(/"/g, '""');
        const catName = (cat?.name || 'Outros').replace(/"/g, '""');
        const accountName = (tx.account || 'Principal').replace(/"/g, '""');
        const typeLabel = tx.type === 'income' ? 'Receita' : 'Despesa';
        const formattedAmount = tx.amount.toFixed(2).replace('.', ',');

        return `"${dateStr}";"${descClean}";"${catName}";"${accountName}";"${typeLabel}";"${formattedAmount}"`;
      });

      // UTF-8 BOM so Microsoft Excel opens characters like 'ç', 'ã', 'é' correctly
      const bom = '\uFEFF';
      const csvContent = bom + headers.join(';') + '\n' + rows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileSafePeriod = selectedPeriod === 'current_month' ? 'mes_atual' : selectedPeriod === 'last_30_days' ? 'ultimos_30_dias' : 'historico_completo';
      link.download = `extrato_saldo_${fileSafePeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast(
        'Planilha baixada!',
        `Extrato com ${sortedTransactions.length} lançamentos exportado em CSV.`,
        'success'
      );
    } catch {
      onShowToast('Falha na exportação', 'Não foi possível gerar a planilha CSV.', 'error');
    }
  };

  // PDF Print Handler
  const handlePrintPDF = () => {
    if (sortedTransactions.length === 0) {
      onShowToast('Nenhum dado', 'Não há transações no período selecionado para exportar.', 'warning');
      return;
    }

    try {
      triggerHaptic('success', true);

      // Create a printable iframe with beautifully styled report
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      const rowsHtml = sortedTransactions
        .map(tx => {
          const cat = getCategoryById(tx.categoryId, categories);
          const isIncome = tx.type === 'income';
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-size: 13px; color: #475569;">${formatDate(tx.date)}</td>
              <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #0f172a;">${tx.description}</td>
              <td style="padding: 10px 12px; font-size: 13px; color: #475569;">${cat?.name || 'Outros'}</td>
              <td style="padding: 10px 12px; font-size: 13px; color: #64748b;">${tx.account || 'Principal'}</td>
              <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: ${isIncome ? '#059669' : '#e11d48'};">
                ${isIncome ? '+ Receita' : '- Despesa'}
              </td>
              <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; text-align: right; color: ${isIncome ? '#059669' : '#e11d48'}; font-family: monospace;">
                ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
              </td>
            </tr>
          `;
        })
        .join('');

      const printHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>Extrato Financeiro - Saldo</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo-badge {
              width: 38px;
              height: 38px;
              background-color: #10b981;
              color: white;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 18px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 2px;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #475569;
              line-height: 1.5;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 28px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 14px 16px;
              background-color: #f8fafc;
            }
            .summary-label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: 800;
              font-family: monospace;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th {
              background-color: #f1f5f9;
              padding: 10px 12px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #475569;
              text-align: left;
              border-top: 1px solid #cbd5e1;
              border-bottom: 2px solid #cbd5e1;
            }
            .footer {
              margin-top: 36px;
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <div class="logo-badge">$</div>
              <div>
                <h1 class="title">Extrato Financeiro</h1>
                <div class="subtitle">Saldo — Gerenciamento Financeiro Pessoal</div>
              </div>
            </div>
            <div class="meta">
              <div><strong>Titular:</strong> ${userName}</div>
              <div><strong>Período:</strong> ${periodLabel}</div>
              <div><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total de Entradas</div>
              <div class="summary-value" style="color: #059669;">${formatCurrency(summary.totalIncome)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total de Saídas</div>
              <div class="summary-value" style="color: #e11d48;">${formatCurrency(summary.totalExpense)}</div>
            </div>
            <div class="summary-card" style="background-color: ${summary.balance >= 0 ? '#ecfdf5' : '#fff1f2'}; border-color: ${summary.balance >= 0 ? '#a7f3d0' : '#fecdd3'};">
              <div class="summary-label" style="color: ${summary.balance >= 0 ? '#065f46' : '#9f1239'};">Saldo do Período</div>
              <div class="summary-value" style="color: ${summary.balance >= 0 ? '#059669' : '#e11d48'};">${formatCurrency(summary.balance)}</div>
            </div>
          </div>

          <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #0f172a;">
            Lançamentos (${sortedTransactions.length} registros)
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Conta / Forma</th>
                <th>Tipo</th>
                <th style="text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <span>Relatório confidencial gerado pelo aplicativo Saldo</span>
            <span>Página 1 de 1</span>
          </div>
        </body>
        </html>
      `;

      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 3000);
      }, 500);

      onShowToast('Janela de Impressão aberta', 'Escolha "Salvar como PDF" ou envie para uma impressora.', 'info');
    } catch {
      window.print();
    }
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

          {/* Modal Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Exportar Extrato & Relatório
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Baixe em planilha (CSV) ou salve relatório formatado em PDF
                  </p>
                </div>
              </div>
              <button
                id="btn-close-export"
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              {/* 1. SELEÇÃO DE PERÍODO */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Período da Exportação
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {/* Mês Atual */}
                  <button
                    id="btn-period-current-month"
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('current_month');
                      triggerHaptic('light', true);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedPeriod === 'current_month'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">Mês Atual</span>
                    <span className="text-[10px] opacity-75 truncate max-w-full">
                      {currentMonthName}
                    </span>
                  </button>

                  {/* Últimos 30 Dias */}
                  <button
                    id="btn-period-last-30"
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('last_30_days');
                      triggerHaptic('light', true);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedPeriod === 'last_30_days'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">Últimos 30 Dias</span>
                    <span className="text-[10px] opacity-75">Período recente</span>
                  </button>

                  {/* Todo o Histórico */}
                  <button
                    id="btn-period-all-time"
                    type="button"
                    onClick={() => {
                      setSelectedPeriod('all_time');
                      triggerHaptic('light', true);
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedPeriod === 'all_time'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">Todo o Histórico</span>
                    <span className="text-[10px] opacity-75">Completo</span>
                  </button>
                </div>
              </div>

              {/* 2. RESUMO FINANCEIRO DO PERÍODO */}
              <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Filter className="w-3.5 h-3.5 text-zinc-500" />
                    {periodLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                    {summary.count} {summary.count === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Entradas
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono mt-0.5 truncate">
                      {formatCurrency(summary.totalIncome)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                      Saídas
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-rose-400 font-mono mt-0.5 truncate">
                      {formatCurrency(summary.totalExpense)}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-cyan-400" />
                      Saldo Líquido
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono mt-0.5 truncate ${
                        summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(summary.balance)}
                    </span>
                  </div>
                </div>

                {summary.count === 0 && (
                  <div className="pt-2 text-center text-xs text-zinc-500">
                    Nenhum lançamento registrado neste intervalo.
                  </div>
                )}
              </div>

              {/* 3. AÇÕES DE EXPORTAÇÃO */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Formatos de Exportação
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Botão CSV */}
                  <button
                    id="btn-download-csv"
                    type="button"
                    onClick={handleDownloadCSV}
                    disabled={summary.count === 0}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Baixar Planilha (CSV / Excel)
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        Compatível com Excel, Google Planilhas e Numbers
                      </span>
                    </div>
                  </button>

                  {/* Botão PDF */}
                  <button
                    id="btn-export-pdf"
                    type="button"
                    onClick={handlePrintPDF}
                    disabled={summary.count === 0}
                    className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-[0.98] border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        Salvar / Imprimir Relatório em PDF
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        Layout pronto para impressão ou salvar em PDF
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. TOGGLE PRÉVIA DOS DADOS */}
              {summary.count > 0 && (
                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowPreview(prev => !prev)}
                    className="w-full py-2 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      {showPreview ? 'Ocultar prévia da tabela' : `Ver prévia dos lançamentos (${summary.count})`}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        showPreview ? 'rotate-90 text-white' : 'text-zinc-500'
                      }`}
                    />
                  </button>

                  {showPreview && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/60 text-xs">
                      {sortedTransactions.slice(0, 15).map(tx => {
                        const isIncome = tx.type === 'income';
                        return (
                          <div key={tx.id} className="p-2.5 flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-white truncate text-xs">
                                {tx.description}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {formatDate(tx.date)} · {tx.account || 'Principal'}
                              </span>
                            </div>
                            <span
                              className={`font-bold font-mono text-xs shrink-0 ${
                                isIncome ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {sortedTransactions.length > 15 && (
                        <div className="p-2 text-center text-[10px] text-zinc-500 italic">
                          + {sortedTransactions.length - 15} outros lançamentos incluídos no extrato.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                id="btn-close-export-done"
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Fechar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
