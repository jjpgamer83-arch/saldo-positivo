import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Lock,
  Key,
  Fingerprint,
  Clock,
  EyeOff,
  Mail,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SecuritySettings, AutoLockTimeout } from '../../types';
import { PinModal } from './PinModal';
import { isBiometricsAvailable, authenticateWithBiometrics } from '../../utils/biometrics';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  pinHash: '',
  biometricsEnabled: false,
  autoLockTimeout: '5min',
  startWithHiddenBalance: false,
};

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SecuritySettings;
  onUpdateSettings: (newSettings: SecuritySettings) => void;
  userEmail?: string;
  onLockNow: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userEmail = '',
  onLockNow,
  onShowToast,
}) => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  useEffect(() => {
    isBiometricsAvailable().then(avail => {
      setHasBiometricHardware(avail);
    });
  }, [isOpen]);

  const handleTogglePin = () => {
    if (settings.pinEnabled) {
      // Disable PIN
      onUpdateSettings({
        ...settings,
        pinEnabled: false,
        biometricsEnabled: false, // Biometrics requires PIN fallback
      });
      onShowToast('PIN desativado', 'O bloqueio do aplicativo foi desligado.', 'info');
    } else {
      // Enable PIN: open modal to set
      setIsChangingPin(false);
      setIsPinModalOpen(true);
    }
  };

  const handleSavePin = (newPin: string) => {
    onUpdateSettings({
      ...settings,
      pinEnabled: true,
      pinHash: newPin,
    });
    onShowToast('PIN configurado', 'Seu código de 4 dígitos foi salvo com sucesso.', 'success');
  };

  const handleToggleBiometrics = async () => {
    if (!settings.pinEnabled) {
      onShowToast(
        'PIN obrigatório',
        'Configure primeiro um PIN de 4 dígitos antes de ativar o Touch ID / Face ID.',
        'warning'
      );
      return;
    }

    if (!settings.biometricsEnabled) {
      // Test biometrics first
      const success = await authenticateWithBiometrics();
      if (success) {
        onUpdateSettings({
          ...settings,
          biometricsEnabled: true,
        });
        onShowToast('Biometria ativada', 'Face ID / Touch ID configurado para desbloqueio.', 'success');
      } else {
        onShowToast(
          'Biometria cancelada',
          'Não foi possível autenticar o sensor biométrico do seu aparelho.',
          'warning'
        );
      }
    } else {
      onUpdateSettings({
        ...settings,
        biometricsEnabled: false,
      });
      onShowToast('Biometria desativada', 'O desbloqueio será feito apenas via PIN.', 'info');
    }
  };

  const handleChangeAutoLock = (timeout: AutoLockTimeout) => {
    onUpdateSettings({
      ...settings,
      autoLockTimeout: timeout,
    });
    onShowToast('Tempo de bloqueio salvo', 'Preferência de inatividade atualizada.', 'info');
  };

  const handleToggleHiddenBalance = () => {
    const nextVal = !settings.startWithHiddenBalance;
    onUpdateSettings({
      ...settings,
      startWithHiddenBalance: nextVal,
    });
    onShowToast(
      nextVal ? 'Privacidade ativada' : 'Privacidade desativada',
      nextVal
        ? 'O aplicativo iniciará com os saldos ocultos.'
        : 'O aplicativo exibirá saldos normalmente ao abrir.',
      'info'
    );
  };

  const handleSendPasswordReset = async () => {
    if (!userEmail) {
      onShowToast('E-mail não identificado', 'Faça login com sua conta para redefinir a senha.', 'warning');
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      onShowToast(
        'E-mail de redefinição enviado!',
        `Enviamos as instruções para ${userEmail}. Verifique sua caixa de entrada e spam.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Erro ao enviar', err.message || 'Falha ao solicitar redefinição de senha.', 'error');
    } finally {
      setIsSendingResetEmail(false);
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
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Segurança e Privacidade
              </h2>
              <p className="text-xs text-zinc-400">
                Proteja seus dados financeiros com PIN, biometria e tempo de bloqueio
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {/* Seção 1: Bloqueio por PIN */}
          <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Bloqueio com PIN de 4 dígitos
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Exige uma senha de 4 números antes de abrir o aplicativo.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePin}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.pinEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.pinEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Ações adicionais se PIN estiver ativado */}
            {settings.pinEnabled && (
              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>PIN ativo e configurado</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setIsPinModalOpen(true);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Alterar PIN
                </button>
              </div>
            )}
          </div>

          {/* Seção 2: Biometria (Touch ID / Face ID) */}
          <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Touch ID / Face ID / Windows Hello
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Desbloqueie instantaneamente com a biometria nativa do seu aparelho.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBiometrics}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.biometricsEnabled ? 'bg-cyan-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.biometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 pt-1">
              {hasBiometricHardware
                ? '✓ Sensor biométrico detectado neste dispositivo.'
                : 'Aviso: Este navegador ou dispositivo pode requerer ativação nas preferências do sistema.'}
            </div>
          </div>

          {/* Seção 3: Tempo de Bloqueio Automático */}
          <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4.5 space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Bloqueio Automático por Inatividade</span>
            </div>

            <p className="text-xs text-zinc-400">
              Escolha quando o aplicativo deve exigir novamente o PIN ao ficar em segundo plano ou sem uso:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'immediate' as AutoLockTimeout, label: 'Imediato', desc: 'Ao sair da tela' },
                { id: '1min' as AutoLockTimeout, label: '1 minuto', desc: 'Após 60s' },
                { id: '5min' as AutoLockTimeout, label: '5 minutos', desc: 'Após 5 min' },
                { id: 'disabled' as AutoLockTimeout, label: 'Desativado', desc: 'Apenas manual' },
              ].map(opt => {
                const isSelected = settings.autoLockTimeout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChangeAutoLock(opt.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-zinc-500">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 4: Privacidade de Saldos */}
          <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white">
                  Iniciar com saldos ocultos
                </span>
                <span className="text-[11px] text-zinc-400">
                  Oculta automaticamente todos os valores monetários ao abrir o app para maior privacidade em público.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleHiddenBalance}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.startWithHiddenBalance ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.startWithHiddenBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Seção 5: Alterar Senha Firebase Auth */}
          <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white">
                  Alterar senha da conta
                </span>
                <span className="text-[11px] text-zinc-400">
                  Redefina sua senha de acesso via link seguro enviado por e-mail ({userEmail}).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={isSendingResetEmail}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSendingResetEmail ? 'Enviando...' : 'Enviar e-mail'}
            </button>
          </div>

          {/* Botão para testar o bloqueio imediatamente */}
          {settings.pinEnabled && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLockNow();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Bloquear aplicativo agora para testar</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-400">
          <span>Configurações salvas no aparelho</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </motion.div>

      {/* Sub-modal para digitar e confirmar PIN */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onPinSet={handleSavePin}
        currentPin={settings.pinHash}
        isChanging={isChangingPin}
      />
    </div>
  );
};
