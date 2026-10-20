import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Bell,
  Shield,
  Sliders,
  Database,
  ChevronRight,
  User,
  Edit3,
  X,
  Check,
  Sparkles,
  Info,
  Clock,
  Smartphone,
  Fingerprint,
  Mail,
  ExternalLink,
  LogOut,
  DownloadCloud,
  Share2,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { TabType } from '../../types';
import { auth } from '../../lib/firebase';
import { GeneralPreferences } from '../../types';
import { getUserInitials } from '../../utils/formatters';
import { signOut } from 'firebase/auth';
import { usePWAInstall } from '../../utils/usePWAInstall';

interface MoreScreenProps {
  userName?: string;
  userEmail?: string;
  onNavigateTab?: (tab: TabType) => void;
  onOpenAccounts?: () => void;
  onOpenNotifications?: () => void;
  onOpenBankSettings?: () => void;
  onOpenSecurity?: () => void;
  onOpenPreferences?: () => void;
  currentPreferences?: GeneralPreferences;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onUpdateProfile?: (updatedProfile: { name: string; email: string }) => void;
  onSignOut?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  userName = 'Usuário',
  userEmail = '',
  onNavigateTab,
  onOpenAccounts,
  onOpenNotifications,
  onOpenBankSettings,
  onOpenSecurity,
  onOpenPreferences,
  currentPreferences,
  onShowToast,
  onUpdateProfile,
  onSignOut,
}) => {
  const derivedName = (userName && userName.trim() && userName.trim() !== 'Usuário')
    ? userName.trim()
    : (userEmail ? userEmail.split('@')[0] : 'Usuário');
  const plan = 'Plano Pro';
  const initials = getUserInitials(userName, userEmail);

  // Modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installDeviceTab, setInstallDeviceTab] = useState<'ios' | 'android'>('android');
  const [editName, setEditName] = useState(derivedName);
  const [editEmail, setEditEmail] = useState(userEmail);

  // PWA Install Prompt Hook
  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();

  // "Em breve" preview modal state
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    icon: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    description: '',
    icon: null,
  });

  const handleOpenComingSoon = (title: string, description: string, icon: React.ReactNode) => {
    setComingSoonModal({
      isOpen: true,
      title,
      description,
      icon,
    });
  };

  const handleCloseComingSoon = () => {
    setComingSoonModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setInstallDeviceTab('ios');
    } else {
      setInstallDeviceTab('android');
    }

    const outcome = await triggerInstall();
    if (outcome === 'accepted') {
      onShowToast('Aplicativo Instalado!', 'Saldo foi adicionado à sua tela inicial com sucesso.', 'success');
    } else if (outcome === 'installed') {
      onShowToast('Aplicativo já instalado', 'Você já está usando o Saldo em tela cheia.', 'info');
    } else if (outcome === 'ios') {
      setInstallDeviceTab('ios');
      setIsInstallModalOpen(true);
    } else if (outcome === 'manual') {
      setInstallDeviceTab('android');
      setIsInstallModalOpen(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      onShowToast('Nome inválido', 'Por favor, informe seu nome completo.', 'warning');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      onShowToast('E-mail inválido', 'Informe um endereço de e-mail válido.', 'warning');
      return;
    }

    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      });
    }
    
    setIsEditProfileOpen(false);
    onShowToast('Perfil atualizado', 'Suas informações foram salvas com sucesso.', 'success');
  };

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        onSignOut();
      }
      await signOut(auth);
      onShowToast('Sessão encerrada', 'Você saiu da sua conta com sucesso.', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      onShowToast('Erro ao sair', 'Não foi possível encerrar a sessão.', 'error');
    }
  };

  return (
    <motion.div
      id="more-screen"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 pb-28 pt-2"
    >
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Mais
        </h1>
        <p className="text-xs text-zinc-400">
          Contas, configurações e preferências.
        </p>
      </div>

      {/* 2. PERFIL */}
      <div
        id="more-profile-card"
        className="rounded-3xl bg-zinc-900/80 p-4 sm:p-5 border border-white/[0.08] relative overflow-hidden shadow-xl backdrop-blur-md"
      >
        {/* Subtle accent glow behind avatar */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/25 via-zinc-800 to-indigo-500/25 border border-white/15 flex items-center justify-center text-base font-bold text-white shadow-inner">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#090a0f]" />
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  {derivedName}
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {plan}
                </span>
              </div>
              <span className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </span>
            </div>
          </div>

          {/* Action: Editar perfil */}
          <button
            id="btn-edit-profile"
            type="button"
            onClick={() => {
              setEditName(derivedName);
              setEditEmail(userEmail);
              setIsEditProfileOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95"
            aria-label="Editar perfil"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar perfil</span>
            <span className="sm:hidden">Editar</span>
          </button>
        </div>
      </div>

      {/* 3. SEÇÃO FINANÇAS */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
          Finanças
        </span>
        <div className="flex flex-col rounded-2xl bg-zinc-900/60 border border-white/[0.06] divide-y divide-white/[0.06] overflow-hidden">
          {/* Opção: Contas e carteiras */}
          <button
            id="btn-nav-accounts"
            type="button"
            onClick={() => {
              if (onOpenAccounts) {
                onOpenAccounts();
              } else {
                handleOpenComingSoon(
                  'Contas e carteiras',
                  'Gerencie suas contas bancárias (correntes, poupanças e investimentos), carteiras de dinheiro e consulte saldos individuais.',
                  <Wallet className="w-5 h-5 text-emerald-400" />
                );
              }
            }}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                  Contas e carteiras
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  Gerencie suas contas, carteiras e saldos.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

        </div>
      </div>

      {/* 4. SEÇÃO PREFERÊNCIAS */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
          Preferências
        </span>
        <div className="flex flex-col rounded-2xl bg-zinc-900/60 border border-white/[0.06] divide-y divide-white/[0.06] overflow-hidden">
          {/* Notificações */}
          <button
            id="btn-nav-notifications"
            type="button"
            onClick={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else {
                handleOpenComingSoon(
                  'Notificações',
                  'Configure alertas de vencimento de faturas, avisos de limite mensal e lembretes de metas.',
                  <Bell className="w-5 h-5 text-amber-400" />
                );
              }
            }}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                  Notificações
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  Configure alertas e lembretes.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Detecção de Despesas Bancárias (Android/Capacitor) */}
          <button
            id="btn-nav-bank-detection"
            type="button"
            onClick={() => {
              if (onOpenBankSettings) {
                onOpenBankSettings();
              } else {
                handleOpenComingSoon(
                  'Detecção de Despesas Bancárias',
                  'Permite registrar compras e transferências automaticamente a partir das notificações bancárias do Android.',
                  <BellRing className="w-5 h-5 text-indigo-400" />
                );
              }
            }}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                    Detecção de Despesas Bancárias
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    Android
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 truncate">
                  Leitura automática de notificações de bancos (Nubank, Itaú, BB, etc.).
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Segurança */}
          <button
            id="btn-nav-security"
            type="button"
            onClick={() => {
              if (onOpenSecurity) {
                onOpenSecurity();
              } else {
                handleOpenComingSoon(
                  'Segurança',
                  'Ative autenticação por biometria (Face ID/Touch ID), senha de bloqueio de 4 dígitos e tempo de inatividade para proteção do aplicativo.',
                  <Shield className="w-5 h-5 text-cyan-400" />
                );
              }
            }}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                  Segurança
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  Biometria, bloqueio e proteção do aplicativo.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Preferências */}
          <button
            id="btn-nav-preferences"
            type="button"
            onClick={() => {
              if (onOpenPreferences) {
                onOpenPreferences();
              } else {
                handleOpenComingSoon(
                  'Preferências Gerais',
                  'Ajuste o tema visual (Escuro/Claro/Automático), moeda padrão (BRL/USD/EUR), primeiro dia da semana e configurações gerais.',
                  <Sliders className="w-5 h-5 text-purple-400" />
                );
              }
            }}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                  Preferências Gerais
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {currentPreferences
                    ? `${
                        currentPreferences.theme === 'dark'
                          ? 'Escuro'
                          : currentPreferences.theme === 'light'
                          ? 'Claro'
                          : 'Automático'
                      } · ${currentPreferences.currency} (${
                        currentPreferences.currency === 'BRL'
                          ? 'R$'
                          : currentPreferences.currency === 'USD'
                          ? '$'
                          : '€'
                      }) · ${currentPreferences.dateFormat}`
                    : 'Tema, moeda, datas e vibração.'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Instalar Aplicativo no Celular (PWA) */}
          <button
            id="btn-install-pwa"
            type="button"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <DownloadCloud className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                    Instalar Aplicativo no Celular
                  </span>
                  {isInstalled ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                      Instalado
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      PWA
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-400 truncate">
                  {isInstalled
                    ? 'Saldo instalado na tela de início.'
                    : 'Acesse em tela cheia com ícone na tela inicial.'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 5. SEÇÃO DADOS */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
          Dados
        </span>
        <div className="flex flex-col rounded-2xl bg-zinc-900/60 border border-white/[0.06] overflow-hidden">
          {/* Dados e sincronização */}
          <button
            id="btn-nav-data-sync"
            type="button"
            onClick={() =>
              handleOpenComingSoon(
                'Dados e sincronização',
                'Faça backup seguro dos seus registros, exporte relatórios em formato CSV/PDF e importe extratos financeiros.',
                <Database className="w-5 h-5 text-emerald-400" />
              )
            }
            className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer active:bg-zinc-800/70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                  Dados e sincronização
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  Backup, importação, exportação e sincronização.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 6. SAIR DA CONTA */}
      <div className="flex flex-col gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-rose-400 text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>

      {/* 7. INFORMAÇÕES DO APLICATIVO */}
      <div className="flex flex-col items-center justify-center gap-1 pt-4 pb-2 text-center">
        <span className="text-xs font-semibold tracking-wider text-zinc-400">
          Saldo
        </span>
        <span className="text-[11px] text-zinc-600 font-mono">
          Versão 1.0.0
        </span>
      </div>

      {/* MODAL: EDITAR PERFIL */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              id="modal-edit-profile"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-50 w-full max-w-md bg-zinc-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Editar Perfil</h3>
                    <p className="text-[11px] text-zinc-400">
                      Atualize seu nome de exibição e e-mail
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Ex: Alex Silva"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Endereço de E-mail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="Ex: alex.silva@email.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Salvar alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INSTRUÇÕES DE INSTALAÇÃO PWA */}
      <AnimatePresence>
        {isInstallModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInstallModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />

            <motion.div
              id="modal-pwa-install"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-50 w-full max-w-md bg-zinc-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-zinc-800 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Instalar o Saldo</h3>
                    <p className="text-xs text-zinc-400">
                      Adicione à tela inicial do seu celular
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Device Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setInstallDeviceTab('android')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    installDeviceTab === 'android'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android / Chrome</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInstallDeviceTab('ios')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    installDeviceTab === 'ios'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>iPhone / iPad (iOS)</span>
                </button>
              </div>

              {/* Step by step guide */}
              <div className="space-y-3 py-1">
                {installDeviceTab === 'ios' ? (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        No <strong>Safari</strong> do seu iPhone, toque no botão de{' '}
                        <strong className="text-white inline-flex items-center gap-1 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10">
                          <Share2 className="w-3 h-3 text-cyan-400" /> Compartilhar
                        </strong>{' '}
                        na barra inferior.
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        Role as opções para baixo e toque em{' '}
                        <strong className="text-white inline-flex items-center gap-1 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10">
                          <PlusSquare className="w-3 h-3 text-emerald-400" /> Adicionar à Tela de Início
                        </strong>
                        .
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar. O ícone do Saldo aparecerá na sua tela inicial!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        No <strong>Google Chrome</strong> ou navegador do seu celular, toque nos{' '}
                        <strong className="text-white inline-flex items-center gap-1 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10">
                          <MoreVertical className="w-3 h-3 text-zinc-300" /> 3 pontinhos
                        </strong>{' '}
                        do menu no canto superior.
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        Selecione a opção{' '}
                        <strong className="text-white inline-flex items-center gap-1 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10">
                          <DownloadCloud className="w-3 h-3 text-emerald-400" /> Instalar aplicativo
                        </strong>{' '}
                        ou "Adicionar à tela inicial".
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.06] flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <div className="text-zinc-300 leading-relaxed">
                        Confirme clicando em <strong>"Instalar"</strong>. O aplicativo funcionará como um app nativo, sem barras de endereço!
                      </div>
                    </div>
                  </div>
                )}

                {/* Vantagens */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Acesso direto da tela inicial, funciona offline e em tela cheia.</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer active:scale-98 shadow-lg shadow-emerald-500/20"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL / ESTADO: EM BREVE */}
      <AnimatePresence>
        {comingSoonModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseComingSoon}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              id="modal-coming-soon"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-50 w-full max-w-sm bg-zinc-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3.5"
            >
              {/* Badge + Icon */}
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-1">
                {comingSoonModal.icon || <Sparkles className="w-6 h-6" />}
              </div>

              <div className="flex flex-col gap-1 items-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Em breve
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {comingSoonModal.title}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mt-1">
                  {comingSoonModal.description}
                </p>
              </div>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={handleCloseComingSoon}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-98"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
