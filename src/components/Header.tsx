import React, { useMemo } from 'react';
import { Eye, EyeOff, Calendar, Bell, Download } from 'lucide-react';
import { getUserInitials, getUserGreetingName } from '../utils/formatters';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  currentMonth?: string;
  isHidden: boolean;
  onToggleHide: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = '',
  userEmail = '',
  currentMonth,
  isHidden,
  onToggleHide,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenExport,
}) => {
  const displayMonth = currentMonth || '';
  const initials = useMemo(() => getUserInitials(userName, userEmail), [userName, userEmail]);
  const greetingName = useMemo(() => getUserGreetingName(userName, userEmail), [userName, userEmail]);

  return (
    <header className="relative w-full pt-4 pb-3 px-4 flex items-center justify-between">
      {/* User Greeting and Month */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            id="user-avatar-circle"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/25 via-zinc-800 to-indigo-500/25 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-inner select-none tracking-wider"
          >
            <span>{initials}</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090a0f]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
              Olá, {greetingName} <span className="inline-block animate-wave text-sm">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{displayMonth}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Eye Privacy Toggle, Notifications & Export */}
      <div className="flex items-center gap-2">
        {/* Toggle financial privacy */}
        <button
          id="btn-toggle-visibility"
          type="button"
          onClick={onToggleHide}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer ${
            isHidden
              ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
              : 'bg-zinc-900 text-zinc-200 border-white/10 hover:bg-zinc-800 hover:border-white/20'
          }`}
          title={isHidden ? 'Mostrar valores' : 'Ocultar valores'}
          aria-label={isHidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
        >
          {isHidden ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-zinc-300" />}
        </button>

        {/* Notifications Button */}
        {onOpenNotifications && (
          <button
            id="btn-header-notifications"
            type="button"
            onClick={onOpenNotifications}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:border-white/20 hover:text-white cursor-pointer"
            title="Ver notificações e alertas"
            aria-label="Abrir notificações"
          >
            <Bell className="w-4 h-4 text-zinc-300" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        )}

        {/* Export Statement / Reports Button */}
        {onOpenExport && (
          <button
            id="btn-header-export"
            type="button"
            onClick={onOpenExport}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:border-white/20 hover:text-white cursor-pointer group"
            title="Exportar Extrato / Relatório Financeiro"
            aria-label="Exportar Extrato e Relatório Financeiro"
          >
            <Download className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
          </button>
        )}
      </div>
    </header>
  );
};
