import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  BellRing,
  ShieldCheck,
  Smartphone,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Play,
  Info,
} from 'lucide-react';
import { BankDetectionSettings, ParsedBankTransaction } from '../types';
import {
  SUPPORTED_BANKS,
  getBankDetectionSettings,
  saveBankDetectionSettings,
  checkAndroidNotificationPermission,
  requestAndroidNotificationPermission,
  simulateBankNotificationForTesting,
  isCapacitorNative,
} from '../services/notificationListener';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSimulatedTransaction?: (tx: ParsedBankTransaction) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onSimulatedTransaction,
}) => {
  const [settings, setSettings] = useState<BankDetectionSettings>(getBankDetectionSettings());
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getBankDetectionSettings());
      checkAndroidNotificationPermission().then(granted => {
        setHasPermission(granted);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    triggerHaptic('light');
    const updated: BankDetectionSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    setSettings(updated);
    saveBankDetectionSettings(updated);
    onShowToast(
      updated.enabled ? 'Detecção bancária ativada' : 'Detecção bancária pausada',
      updated.enabled
        ? 'O app monitorará notificações de bancos autorizados.'
        : 'Nenhuma notificação bancária será lida.',
      'info'
    );
  };

  const handleToggleAutoApprove = () => {
    triggerHaptic('light');
    const updated: BankDetectionSettings = {
      ...settings,
      autoApproveHighConfidence: !settings.autoApproveHighConfidence,
    };
    setSettings(updated);
    saveBankDetectionSettings(updated);
    onShowToast(
      updated.autoApproveHighConfidence ? 'Auto-aprovação ligada' : 'Modo de revisão ligado',
      updated.autoApproveHighConfidence
        ? 'Compras claras serão lançadas automaticamente.'
        : 'Todas as notificações pedirão sua confirmação prévia.',
      'info'
    );
  };

  const handleToggleBank = (pkg: string) => {
    triggerHaptic('light');
    const currentBanks = Array.isArray(settings?.whitelistedBanks) ? settings.whitelistedBanks : [];
    const isWhitelisted = currentBanks.includes(pkg);
    const updatedBanks = isWhitelisted
      ? currentBanks.filter(p => p !== pkg)
      : [...currentBanks, pkg];

    const updated: BankDetectionSettings = {
      ...settings,
      whitelistedBanks: updatedBanks,
    };
    setSettings(updated);
    saveBankDetectionSettings(updated);
  };

  const handleRequestPermission = async () => {
    triggerHaptic('medium');
    await requestAndroidNotificationPermission();
    const granted = await checkAndroidNotificationPermission();
    setHasPermission(granted);

    if (isCapacitorNative()) {
      onShowToast(
        'Abrindo configurações do Android',
        'Autorize o acesso a notificações para o Saldo Positivo na lista.',
        'info'
      );
    } else {
      onShowToast(
        'Permissão simulada ativada',
        'Ambiente Web: permissão de leitura de notificações ativada para testes.',
        'success'
      );
    }
  };

  const handleRunSimulation = async (type: 'nubank_pix' | 'itau_debito' | 'inter_credit') => {
    setIsSimulating(true);
    triggerHaptic('medium');
    try {
      const parsed = await simulateBankNotificationForTesting(type);
      if (parsed && onSimulatedTransaction) {
        onSimulatedTransaction(parsed);
        onShowToast(
          'Notificação de teste gerada!',
          `Detectada movimentação de ${parsed.bankName}: R$ ${parsed.amount.toFixed(2)}`,
          'success'
        );
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Configurações do Aplicativo
                </h3>
                <p className="text-xs text-slate-400">
                  Automação de notificações bancárias e segurança
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-6">
            {/* Seção 1: Chave Principal de Detecção */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <BellRing size={18} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      Detecção Automática de Despesas
                    </span>
                    <span className="text-xs text-slate-400">
                      Lê compras e transferências das notificações bancárias
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-toggle: Auto-aprovação ou Revisão */}
              {settings.enabled && (
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="pr-4">
                    <span className="text-xs font-medium text-slate-300 block">
                      Revisar sempre antes de lançar
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {settings.autoApproveHighConfidence
                        ? 'Lançamentos claros são adicionados diretamente.'
                        : 'Abre o formulário de confirmação para você validar a categoria.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoApprove}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      !settings.autoApproveHighConfidence ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !settings.autoApproveHighConfidence ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Seção 2: Status de Permissão Android */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={18} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Permissão Android: NotificationListenerService
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                    hasPermission
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {hasPermission ? 'Autorizado' : 'Ação Necessária'}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                O Android exige autorização explícita para que aplicativos leiam alertas de outros apps.
                Seus dados financeiros permanecem exclusivamente salvos no seu dispositivo e na sua conta Firebase.
              </p>

              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              >
                <ShieldCheck size={15} className="text-indigo-400" />
                {hasPermission
                  ? 'Verificar Acesso a Notificações no Sistema'
                  : 'Conceder Permissão no Android'}
                <ExternalLink size={13} className="text-slate-500 ml-1" />
              </button>
            </div>

            {/* Seção 3: Bancos Monitorados (Whitelist) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Bancos e Carteiras Habilitados
                </span>
                <span className="text-[11px] text-slate-500">
                  {settings.whitelistedBanks.length} de {Object.keys(SUPPORTED_BANKS).length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(SUPPORTED_BANKS).map(bank => {
                  const active = settings.whitelistedBanks.includes(bank.packageName);
                  return (
                    <button
                      key={bank.packageName}
                      type="button"
                      onClick={() => handleToggleBank(bank.packageName)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                        active
                          ? 'bg-slate-900 border-slate-700 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: bank.color }}
                        />
                        <span className="font-medium truncate">{bank.name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-700'
                        }`}
                      >
                        {active && <Check size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção 4: Simulador de Notificações para Testes Imediatos */}
            <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles size={16} />
                <span className="text-xs font-semibold">
                  Testar Leitor de Notificações
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dispare uma notificação bancária de demonstração para testar o parser, a extração de valores e o modal de confirmação:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('nubank_pix')}
                  className="p-2 rounded-lg bg-slate-900 border border-purple-500/30 hover:border-purple-500 text-slate-200 text-xs text-center transition-colors"
                >
                  <span className="block font-semibold text-purple-400">Nubank</span>
                  <span className="text-[10px] text-slate-400">Pix R$ 64,50</span>
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('itau_debito')}
                  className="p-2 rounded-lg bg-slate-900 border border-orange-500/30 hover:border-orange-500 text-slate-200 text-xs text-center transition-colors"
                >
                  <span className="block font-semibold text-orange-400">Itaú</span>
                  <span className="text-[10px] text-slate-400">Débito R$ 38,90</span>
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('inter_credit')}
                  className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-slate-200 text-xs text-center transition-colors"
                >
                  <span className="block font-semibold text-amber-400">Inter</span>
                  <span className="text-[10px] text-slate-400">Crédito R$ 149,90</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
