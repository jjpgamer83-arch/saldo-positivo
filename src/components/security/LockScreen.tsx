import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Fingerprint,
  Delete,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authenticateWithBiometrics } from '../../utils/biometrics';
import { getUserInitials } from '../../utils/formatters';

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  correctPin: string;
  biometricsEnabled: boolean;
  userName?: string;
  onSignOut?: () => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isLocked,
  onUnlock,
  correctPin,
  biometricsEnabled,
  userName = '',
  onSignOut,
  onShowToast,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);

  const triggerShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 600);
  };

  const handleKeyPress = useCallback((num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        onUnlock();
        setPin('');
      } else {
        triggerShake('PIN incorreto. Tente novamente.');
      }
    }
  }, [pin, correctPin, onUnlock]);

  const handleBackspace = useCallback(() => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  }, [pin]);

  const handleTriggerBiometrics = useCallback(async () => {
    if (!biometricsEnabled) return;
    setIsBiometricPrompting(true);
    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        onShowToast('Desbloqueado com sucesso', 'Acesso autenticado por biometria.', 'success');
        onUnlock();
      } else {
        setErrorMsg('Autenticação biométrica não concluída');
      }
    } catch {
      setErrorMsg('Falha na biometria');
    } finally {
      setIsBiometricPrompting(false);
    }
  }, [biometricsEnabled, onUnlock, onShowToast]);

  // Try biometrics on first lock presentation if enabled
  useEffect(() => {
    if (isLocked && biometricsEnabled) {
      const timer = setTimeout(() => {
        handleTriggerBiometrics();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLocked, biometricsEnabled]);

  // Physical keyboard support
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleKeyPress, handleBackspace]);

  if (!isLocked) return null;

  const initials = getUserInitials(userName);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#090a0f] flex flex-col items-center justify-between p-6 select-none overflow-y-auto"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/[0.07] rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/[0.05] rounded-full blur-3xl" />

      {/* Header Info */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Saldo Seguro</span>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da conta</span>
          </button>
        )}
      </div>

      {/* Center lock presentation */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto py-6 z-10">
        {/* User avatar with Lock badge */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-zinc-800 to-indigo-500/20 border border-white/10 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-cyan-500/5">
            <span>{initials}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-cyan-500 text-black flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Olá, {userName}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 mb-8">
          Digite seu PIN de 4 dígitos para desbloquear
        </p>

        {/* PIN Dots */}
        <motion.div
          animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-5 mb-8"
        >
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{
                  scale: isFilled ? 1.25 : 1,
                  borderColor: isFilled ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)',
                  backgroundColor: isFilled ? '#06b6d4' : 'transparent',
                }}
                className="w-4 h-4 rounded-full border-2 transition-colors duration-150 shadow-md shadow-cyan-500/20"
              />
            );
          })}
        </motion.div>

        {/* Error / Helper text */}
        <div className="h-6 mb-4 flex items-center justify-center">
          {errorMsg ? (
            <span className="text-xs font-semibold text-rose-400 animate-fadeIn">
              {errorMsg}
            </span>
          ) : biometricsEnabled ? (
            <button
              type="button"
              onClick={handleTriggerBiometrics}
              disabled={isBiometricPrompting}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Usar biometria (Face ID / Touch ID)</span>
            </button>
          ) : (
            <span className="text-xs text-zinc-500">
              Protegido por senha PIN
            </span>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-3.5 max-w-[270px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-15 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 border border-white/[0.06] text-white text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-black/40"
            >
              {num}
            </button>
          ))}

          {/* Biometrics button or empty */}
          {biometricsEnabled ? (
            <button
              type="button"
              onClick={handleTriggerBiometrics}
              disabled={isBiometricPrompting}
              className="h-15 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Desbloquear com biometria"
            >
              <Fingerprint className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-15 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 border border-white/[0.06] text-white text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-black/40"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-15 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800 active:bg-zinc-700 border border-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center text-[11px] text-zinc-500 pb-2 z-10">
        Saldo Seguro • Criptografia e proteção no dispositivo
      </div>
    </motion.div>
  );
};
