import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, Delete, ArrowLeft } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPinSet: (newPin: string) => void;
  currentPin?: string;
  isChanging?: boolean;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onPinSet,
  currentPin,
  isChanging = false,
}) => {
  // Steps: 'verify_old' (if changing) -> 'enter_new' -> 'confirm_new'
  const [step, setStep] = useState<'verify_old' | 'enter_new' | 'confirm_new'>('enter_new');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isChanging && currentPin) {
        setStep('verify_old');
      } else {
        setStep('enter_new');
      }
      setPin('');
      setNewPin('');
      setErrorMsg('');
      setShake(false);
    }
  }, [isOpen, isChanging, currentPin]);

  const triggerShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 600);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      handleCompletePin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleCompletePin = (completedPin: string) => {
    if (step === 'verify_old') {
      if (completedPin === currentPin) {
        setStep('enter_new');
        setPin('');
      } else {
        triggerShake('PIN atual incorreto');
      }
    } else if (step === 'enter_new') {
      setNewPin(completedPin);
      setStep('confirm_new');
      setPin('');
    } else if (step === 'confirm_new') {
      if (completedPin === newPin) {
        onPinSet(completedPin);
        onClose();
      } else {
        triggerShake('Os PINs não coincidem');
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, step, newPin]);

  if (!isOpen) return null;

  const getTitle = () => {
    if (step === 'verify_old') return 'Digite seu PIN atual';
    if (step === 'enter_new') return isChanging ? 'Digite o novo PIN' : 'Crie um PIN de 4 dígitos';
    return 'Confirme o novo PIN';
  };

  const getSubtitle = () => {
    if (step === 'verify_old') return 'Confirme sua identidade para alterar a senha';
    if (step === 'enter_new') return 'Escolha 4 números de fácil memorização';
    return 'Digite novamente para confirmar';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center z-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white text-center">
          {getTitle()}
        </h3>
        <p className="text-xs text-zinc-400 text-center mb-6 mt-0.5">
          {getSubtitle()}
        </p>

        {/* 4 PIN Dots */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{
                  scale: isFilled ? 1.15 : 1,
                  borderColor: isFilled ? '#06b6d4' : 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: isFilled ? '#06b6d4' : 'transparent',
                }}
                className="w-4 h-4 rounded-full border-2 transition-colors duration-150 shadow-sm"
              />
            );
          })}
        </motion.div>

        {/* Error message */}
        <div className="h-5 mb-2 flex items-center justify-center">
          {errorMsg ? (
            <span className="text-xs font-semibold text-rose-400 animate-fadeIn">
              {errorMsg}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">Teclado numérico</span>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-2.5 max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-13 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.06] text-white text-lg font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Empty spacer / cancel */}
          <div />

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.06] text-white text-lg font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800 border border-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
