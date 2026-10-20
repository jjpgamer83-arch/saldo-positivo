import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Sliders,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Calendar,
  Target,
  Sparkles,
  Smartphone,
  ShieldCheck,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  NotificationSettings,
  AppNotification,
  Transaction,
  Budget,
  UpcomingBill,
  FinancialGoal,
  AccountWallet,
} from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  limitWarning80: true,
  limitExceeded100: true,
  upcomingBillsReminder: true,
  billsDueToday: true,
  goalMilestones: true,
  lowBalanceWarning: true,
};

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onShowToast,
}) => {
  // Tabs: 'inbox' (Avisos) or 'settings' (Configurações)
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  // Push notification permission state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onShowToast(
        'Navegador incompatível',
        'Seu navegador atual não suporta a API de notificações do sistema.',
        'warning'
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        onShowToast(
          'Notificações ativadas!',
          'Você receberá alertas importantes sobre seu limite e contas.',
          'success'
        );

        // Send confirmation test notification
        try {
          new Notification('Saldo - Finanças Pessoais', {
            body: 'As notificações foram ativadas com sucesso no seu dispositivo!',
            icon: '/icon-192.png',
          });
        } catch (_) {}
      } else if (permission === 'denied') {
        onShowToast(
          'Permissão negada',
          'Você bloqueou as notificações. Ative-as nas configurações do navegador/sistema se desejar alertas push.',
          'info'
        );
      }
    } catch (err) {
      console.warn('Erro ao solicitar permissão de notificação:', err);
    }
  };

  const handleSendTestPush = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Saldo App • Teste de Alerta', {
          body: 'Notificação de teste recebida com sucesso! Seus alertas estão funcionando.',
          icon: '/icon-192.png',
        });
        onShowToast('Notificação enviada', 'Verifique a central de notificações do seu aparelho.', 'success');
      } catch (e) {
        onShowToast('Aviso', 'Não foi possível disparar o alerta push no momento.', 'warning');
      }
    } else {
      handleRequestPushPermission();
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (filterMode === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filterMode]);

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    onUpdateSettings(updated);
    onShowToast('Preferência salva', 'Configuração de notificação atualizada.', 'info');
  };

  const renderIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-400" />;
      case 'info':
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
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
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Notificações
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Central de alertas financeiros e preferências
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/70 rounded-xl transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-5 sm:px-6 pt-3 pb-2 border-b border-zinc-800/60 bg-zinc-950 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Avisos e Lembretes</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar Alertas</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {activeTab === 'inbox' ? (
            <>
              {/* Push permission trigger banner */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    pushPermission === 'granted'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : pushPermission === 'denied'
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {pushPermission === 'granted'
                        ? 'Notificações push ativas'
                        : pushPermission === 'denied'
                        ? 'Notificações push bloqueadas'
                        : 'Ativar notificações push'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {pushPermission === 'granted'
                        ? 'Você receberá avisos direto no seu aparelho.'
                        : pushPermission === 'denied'
                        ? 'Permissão desativada no navegador.'
                        : 'Receba alertas imediatos de limites e contas a pagar.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {pushPermission === 'granted' ? (
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Enviar teste
                    </button>
                  ) : pushPermission === 'denied' ? (
                    <span className="text-[11px] font-medium text-zinc-500">
                      Bloqueado no navegador
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    >
                      Ativar no celular
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-header / Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Todas ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('unread')}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                      filterMode === 'unread'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Não lidas ({unreadCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllAsRead}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors p-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar lidas</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar todas</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-2.5">
                {displayedNotifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-400/80" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Tudo em dia por aqui!
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      {filterMode === 'unread'
                        ? 'Você não possui notificações não lidas no momento.'
                        : 'Você está dentro do teto de gastos e com todas as contas e metas em ordem.'}
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map(item => {
                    return (
                      <div
                        key={item.id}
                        className={`group relative flex items-start justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                          item.read
                            ? 'bg-zinc-900/40 border-white/[0.04] opacity-80 hover:opacity-100'
                            : 'bg-zinc-900/80 border-white/[0.1] shadow-md shadow-black/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            item.type === 'alert'
                              ? 'bg-rose-500/10 border border-rose-500/20'
                              : item.type === 'warning'
                              ? 'bg-amber-500/10 border border-amber-500/20'
                              : item.type === 'success'
                              ? 'bg-emerald-500/10 border border-emerald-500/20'
                              : 'bg-cyan-500/10 border border-cyan-500/20'
                          }`}>
                            {renderIconForType(item.type)}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${
                                item.read ? 'text-zinc-200' : 'text-white'
                              }`}>
                                {item.title}
                              </h4>
                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-zinc-500 mt-1">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Item Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => onMarkAsRead(item.id)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Marcar como lida"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteNotification(item.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remover aviso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Tab: Configurações de Alertas */
            <div className="space-y-4">
              {/* Seção 1: Limite e Orçamento */}
              <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4" />
                  <span>Limite e Gastos Mensais</span>
                </div>

                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {/* Alerta 80% */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Alerta de 80% do limite
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Avisar quando seus gastos atingirem 80% do orçamento do mês.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('limitWarning80')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.limitWarning80 ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.limitWarning80 ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Alerta 100% */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Alerta de teto excedido (100%)
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Notificação urgente quando o teto de gastos for atingido ou ultrapassado.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('limitExceeded100')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.limitExceeded100 ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.limitExceeded100 ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 2: Contas e Faturas */}
              <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Contas e Faturas a Pagar</span>
                </div>

                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {/* Lembrete de contas próximas */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Lembretes de contas a vencer
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Avisos preventivos sobre faturas e contas pendentes nos próximos dias.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('upcomingBillsReminder')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.upcomingBillsReminder ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.upcomingBillsReminder ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Vencimento no dia */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Aviso de vencimento hoje
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Alerta de alta prioridade quando uma conta vencer no dia corrente.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('billsDueToday')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.billsDueToday ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.billsDueToday ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 3: Metas e Carteira */}
              <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  <span>Metas Financeiras e Carteira</span>
                </div>

                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {/* Conquistas de Metas */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Marcos e progresso de metas
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Comemorações ao atingir 50%, 75% e 100% dos seus objetivos.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('goalMilestones')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.goalMilestones ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.goalMilestones ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Aviso de Saldo Baixo */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex flex-col pr-4">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Alerta de saldo baixo
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Notificar quando o saldo disponível geral estiver abaixo de R$ 100,00.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('lowBalanceWarning')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.lowBalanceWarning ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.lowBalanceWarning ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-400">
          <span>
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Utility function to dynamically generate contextual notifications
 * based on current financial state and user settings.
 */
export function generateContextualNotifications(
  transactions: Transaction[],
  budget: Budget,
  upcomingBills: UpcomingBill[],
  goals: FinancialGoal[],
  accounts: AccountWallet[],
  settings: NotificationSettings,
  dismissedIds: string[] = []
): AppNotification[] {
  const result: AppNotification[] = [];

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const percentage = budget.monthlyLimit > 0 ? (totalExpense / budget.monthlyLimit) * 100 : 0;

  // 1. Alerta de 100% limite excedido
  if (settings.limitExceeded100 && percentage >= 100) {
    result.push({
      id: 'notif-limit-100',
      title: 'Teto de gastos mensal excedido!',
      message: `Você ultrapassou o orçamento estabelecido. Já foram gastos ${formatCurrency(totalExpense)} de ${formatCurrency(budget.monthlyLimit)} (${percentage.toFixed(0)}%).`,
      type: 'alert',
      category: 'limit',
      timestamp: 'Hoje',
      read: false,
      createdAt: Date.now() - 3600000,
    });
  } else if (settings.limitWarning80 && percentage >= 80) {
    // 2. Alerta de 80% limite atingido
    result.push({
      id: 'notif-limit-80',
      title: 'Atenção: 80% do limite atingido',
      message: `Seus gastos já atingiram ${percentage.toFixed(0)}% do teto mensal (${formatCurrency(totalExpense)} de ${formatCurrency(budget.monthlyLimit)}). Modere despesas até o fim do mês.`,
      type: 'warning',
      category: 'limit',
      timestamp: 'Hoje',
      read: false,
      createdAt: Date.now() - 7200000,
    });
  }

  // 3. Contas a pagar pendentes
  if (settings.upcomingBillsReminder) {
    const pendingBills = upcomingBills.filter(b => b.status === 'pending');
    if (pendingBills.length > 0) {
      const firstBill = pendingBills[0];
      result.push({
        id: `notif-bill-${firstBill.id}`,
        title: `Lembrete: ${firstBill.name}`,
        message: `Fatura de ${formatCurrency(firstBill.amount)} com vencimento previsto para o dia ${firstBill.dueDay}.`,
        type: 'info',
        category: 'bill',
        timestamp: 'Vence em breve',
        read: false,
        createdAt: Date.now() - 86400000,
      });
    }
  }

  // 4. Metas financeiras
  if (settings.goalMilestones && goals.length > 0) {
    const topGoal = goals[0];
    const goalPct = topGoal.targetAmount > 0 ? (topGoal.currentAmount / topGoal.targetAmount) * 100 : 0;
    if (goalPct >= 40) {
      result.push({
        id: `notif-goal-${topGoal.id}`,
        title: `Meta "${topGoal.name}": ${goalPct.toFixed(0)}% concluída!`,
        message: `Você já acumulou ${formatCurrency(topGoal.currentAmount)} de ${formatCurrency(topGoal.targetAmount)}. Continue firme no seu objetivo!`,
        type: 'success',
        category: 'goal',
        timestamp: 'Esta semana',
        read: false,
        createdAt: Date.now() - 172800000,
      });
    }
  }

  // 5. Saldo baixo
  if (settings.lowBalanceWarning && currentBalance < 100 && currentBalance >= 0) {
    result.push({
      id: 'notif-balance-low',
      title: 'Saldo disponível baixo',
      message: `Seu saldo geral está em ${formatCurrency(currentBalance)}. Considere transferir recursos ou economizar nas próximas compras.`,
      type: 'warning',
      category: 'balance',
      timestamp: 'Hoje',
      read: false,
      createdAt: Date.now() - 1800000,
    });
  }

  // Filter out any dismissed IDs
  return result.filter(n => !dismissedIds.includes(n.id));
}
