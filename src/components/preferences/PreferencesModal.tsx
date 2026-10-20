import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Calendar,
  Smartphone,
  RotateCcw,
  Check,
  Sparkles,
  Info,
  Vibrate,
  CalendarDays,
  Globe,
  Palette,
} from 'lucide-react';
import {
  GeneralPreferences,
  ThemeMode,
  CurrencyCode,
  FirstDayOfWeek,
  DateFormatOption,
} from '../../types';
import { formatCurrency, CURRENCY_CONFIGS } from '../../utils/formatters';
import { triggerHaptic, isHapticsSupported } from '../../utils/haptics';

export const DEFAULT_GENERAL_PREFERENCES: GeneralPreferences = {
  theme: 'dark',
  currency: 'BRL',
  firstDayOfWeek: 'sunday',
  dateFormat: 'DD/MM/AAAA',
  hapticFeedbackEnabled: true,
};

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: GeneralPreferences;
  onUpdatePreferences: (updated: GeneralPreferences) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onShowToast,
}) => {
  const [localPrefs, setLocalPrefs] = useState<GeneralPreferences>(preferences);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [systemDetectedDark, setSystemDetectedDark] = useState(true);

  // Sync state when props change
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Detect system theme
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDetectedDark(media.matches);
      const listener = (e: MediaQueryListEvent) => setSystemDetectedDark(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  const handleChangeTheme = (theme: ThemeMode) => {
    const updated = { ...localPrefs, theme };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
    triggerHaptic('light', localPrefs.hapticFeedbackEnabled);
    const label = theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Automático (Sistema)';
    onShowToast('Tema atualizado', `Modo visual definido para ${label}.`, 'info');
  };

  const handleChangeCurrency = (currency: CurrencyCode) => {
    const updated = { ...localPrefs, currency };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
    triggerHaptic('light', localPrefs.hapticFeedbackEnabled);
    const config = CURRENCY_CONFIGS[currency];
    onShowToast('Moeda padrão alterada', `Valores agora exibidos em ${config.name}.`, 'success');
  };

  const handleChangeFirstDay = (firstDayOfWeek: FirstDayOfWeek) => {
    const updated = { ...localPrefs, firstDayOfWeek };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
    triggerHaptic('light', localPrefs.hapticFeedbackEnabled);
    const label = firstDayOfWeek === 'sunday' ? 'Domingo' : 'Segunda-feira';
    onShowToast('Primeiro dia da semana', `Calendários iniciarão no(a) ${label}.`, 'info');
  };

  const handleChangeDateFormat = (dateFormat: DateFormatOption) => {
    const updated = { ...localPrefs, dateFormat };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
    triggerHaptic('light', localPrefs.hapticFeedbackEnabled);
    onShowToast('Formato de data', `Datas formatadas no padrão ${dateFormat}.`, 'info');
  };

  const handleToggleHaptic = () => {
    const nextState = !localPrefs.hapticFeedbackEnabled;
    const updated = { ...localPrefs, hapticFeedbackEnabled: nextState };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
    if (nextState) {
      triggerHaptic('success', true);
      onShowToast('Vibração ativada', 'Resposta tátil habilitada ao confirmar ações.', 'success');
    } else {
      onShowToast('Vibração desativada', 'Feedback de vibração desabilitado.', 'info');
    }
  };

  const handleTestVibration = () => {
    if (!isHapticsSupported()) {
      onShowToast(
        'Vibração não suportada',
        'Seu navegador ou dispositivo atual não possui suporte à API de vibração.',
        'warning'
      );
      return;
    }
    triggerHaptic('success', true);
    onShowToast('Vibração testada', 'Padrão tátil disparado com sucesso!', 'success');
  };

  const handleRestoreDefaults = () => {
    setLocalPrefs(DEFAULT_GENERAL_PREFERENCES);
    onUpdatePreferences(DEFAULT_GENERAL_PREFERENCES);
    setShowResetConfirm(false);
    triggerHaptic('medium', true);
    onShowToast(
      'Preferências Restauradas',
      'Tema escuro, BRL (R$), domingo e vibração foram redefinidos para os padrões.',
      'info'
    );
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
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Preferências Gerais
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ajuste o visual, moeda, formato de datas e usabilidade
                  </p>
                </div>
              </div>
              <button
                id="btn-close-preferences"
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-6">
              {/* 1. TEMA VISUAL */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    Tema Visual
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {localPrefs.theme === 'dark'
                      ? 'Noturno ativo'
                      : localPrefs.theme === 'light'
                      ? 'Diurno ativo'
                      : `Sistema (${systemDetectedDark ? 'Escuro' : 'Claro'})`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Escuro */}
                  <button
                    id="btn-theme-dark"
                    type="button"
                    onClick={() => handleChangeTheme('dark')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      localPrefs.theme === 'dark'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        localPrefs.theme === 'dark'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Escuro</span>
                      <span className="text-[10px] opacity-75">Noturno</span>
                    </div>
                  </button>

                  {/* Claro */}
                  <button
                    id="btn-theme-light"
                    type="button"
                    onClick={() => handleChangeTheme('light')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      localPrefs.theme === 'light'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        localPrefs.theme === 'light'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Claro</span>
                      <span className="text-[10px] opacity-75">Diurno</span>
                    </div>
                  </button>

                  {/* Sistema / Automático */}
                  <button
                    id="btn-theme-system"
                    type="button"
                    onClick={() => handleChangeTheme('system')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      localPrefs.theme === 'system'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        localPrefs.theme === 'system'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Sistema</span>
                      <span className="text-[10px] opacity-75">Automático</span>
                    </div>
                  </button>
                </div>
              </section>

              {/* 2. MOEDA PADRÃO */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Moeda Padrão
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Reflete em saldos e gráficos
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Real (BRL) */}
                  <button
                    id="btn-currency-brl"
                    type="button"
                    onClick={() => handleChangeCurrency('BRL')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      localPrefs.currency === 'BRL'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        localPrefs.currency === 'BRL'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      R$
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Real BRL</span>
                      <span className="text-[10px] opacity-75 font-mono">Brasil</span>
                    </div>
                  </button>

                  {/* Dólar (USD) */}
                  <button
                    id="btn-currency-usd"
                    type="button"
                    onClick={() => handleChangeCurrency('USD')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      localPrefs.currency === 'USD'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        localPrefs.currency === 'USD'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      $
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Dólar USD</span>
                      <span className="text-[10px] opacity-75 font-mono">EUA</span>
                    </div>
                  </button>

                  {/* Euro (EUR) */}
                  <button
                    id="btn-currency-eur"
                    type="button"
                    onClick={() => handleChangeCurrency('EUR')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      localPrefs.currency === 'EUR'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        localPrefs.currency === 'EUR'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      €
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold block">Euro EUR</span>
                      <span className="text-[10px] opacity-75 font-mono">Europa</span>
                    </div>
                  </button>
                </div>

                {/* Live currency sample box */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Prévia de formatação:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(12450.75, false, localPrefs.currency)}
                  </span>
                </div>
              </section>

              {/* 3. CALENDÁRIO: PRIMEIRO DIA DA SEMANA */}
              <section className="space-y-2.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                  Primeiro Dia da Semana
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-first-day-sunday"
                    type="button"
                    onClick={() => handleChangeFirstDay('sunday')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      localPrefs.firstDayOfWeek === 'sunday'
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Domingo</span>
                      <span className="text-[10px] text-zinc-400">Padrão financeiro</span>
                    </div>
                    {localPrefs.firstDayOfWeek === 'sunday' && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>

                  <button
                    id="btn-first-day-monday"
                    type="button"
                    onClick={() => handleChangeFirstDay('monday')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      localPrefs.firstDayOfWeek === 'monday'
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Segunda-feira</span>
                      <span className="text-[10px] text-zinc-400">Padrão útil/comercial</span>
                    </div>
                    {localPrefs.firstDayOfWeek === 'monday' && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                </div>
              </section>

              {/* 4. FORMATO DE DATA */}
              <section className="space-y-2.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Formato de Data
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {/* DD/MM/AAAA */}
                  <button
                    id="btn-date-format-ddmmyyyy"
                    type="button"
                    onClick={() => handleChangeDateFormat('DD/MM/AAAA')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      localPrefs.dateFormat === 'DD/MM/AAAA'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold block font-mono">DD/MM/AAAA</span>
                    <span className="text-[10px] opacity-75">04/10/2026</span>
                  </button>

                  {/* AAAA-MM-DD */}
                  <button
                    id="btn-date-format-yyyymmdd"
                    type="button"
                    onClick={() => handleChangeDateFormat('AAAA-MM-DD')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      localPrefs.dateFormat === 'AAAA-MM-DD'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold block font-mono">AAAA-MM-DD</span>
                    <span className="text-[10px] opacity-75">2026-10-04</span>
                  </button>

                  {/* MM/DD/AAAA */}
                  <button
                    id="btn-date-format-mmddyyyy"
                    type="button"
                    onClick={() => handleChangeDateFormat('MM/DD/AAAA')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      localPrefs.dateFormat === 'MM/DD/AAAA'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold block font-mono">MM/DD/AAAA</span>
                    <span className="text-[10px] opacity-75">10/04/2026</span>
                  </button>
                </div>
              </section>

              {/* 5. RESPOSTA TÁTIL / VIBRAÇÃO */}
              <section className="space-y-2.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Vibrate className="w-3.5 h-3.5 text-amber-400" />
                  Experiência & Acessibilidade
                </span>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-white block">
                          Resposta tátil (vibração)
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Vibra suavemente ao confirmar lançamentos no celular
                        </span>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      id="toggle-haptic-feedback"
                      type="button"
                      role="switch"
                      aria-checked={localPrefs.hapticFeedbackEnabled}
                      onClick={handleToggleHaptic}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localPrefs.hapticFeedbackEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          localPrefs.hapticFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {localPrefs.hapticFeedbackEnabled && (
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Teste no smartphone
                      </span>
                      <button
                        id="btn-test-vibration"
                        type="button"
                        onClick={handleTestVibration}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Vibrate className="w-3.5 h-3.5" />
                        <span>Testar vibração</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* 6. RESTAURAR PADRÕES */}
              <section className="pt-2 border-t border-zinc-800">
                {!showResetConfirm ? (
                  <button
                    id="btn-restore-preferences-defaults"
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar configurações de fábrica</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-white block">Restaurar padrões?</span>
                        <span className="text-zinc-300">
                          Isso redefinirá o tema para Escuro, moeda para Real (R$), domingo e vibração ligada.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-confirm-restore-defaults"
                        type="button"
                        onClick={handleRestoreDefaults}
                        className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Sim, restaurar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                id="btn-save-preferences-done"
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Concluído</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
