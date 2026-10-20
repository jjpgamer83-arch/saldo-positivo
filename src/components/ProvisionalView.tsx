import React from 'react';
import { ArrowLeft, Clock, Sparkles, ArrowUpDown, Target, Menu, Shield } from 'lucide-react';
import { TabType } from '../types';

interface ProvisionalViewProps {
  tab: TabType;
  onReturnHome: () => void;
}

export const ProvisionalView: React.FC<ProvisionalViewProps> = ({ tab, onReturnHome }) => {
  const meta: Record<
    Exclude<TabType, 'home'>,
    { title: string; icon: React.ReactNode; description: string; plannedFeatures: string[] }
  > = {
    transactions: {
      title: 'Movimentações',
      icon: <ArrowUpDown className="w-8 h-8 text-indigo-400" />,
      description: 'Extrato financeiro unificado e busca avançada.',
      plannedFeatures: [
        'Filtro por período, tipo e categorias',
        'Busca rápida por descrição ou estabelecimento',
        'Comprovantes anexos e notas fiscais',
        'Exportação de extrato (CSV e PDF)',
      ],
    },
    planning: {
      title: 'Planejamento',
      icon: <Target className="w-8 h-8 text-amber-400" />,
      description: 'Metas financeiras, orçamentos e reservas de emergência.',
      plannedFeatures: [
        'Metas personalizadas com termômetro de progresso',
        'Teto de gastos detalhado por categoria',
        'Previsão de fluxo de caixa para os próximos meses',
        'Simulador de investimentos e quitação de dívidas',
      ],
    },
    more: {
      title: 'Mais',
      icon: <Menu className="w-8 h-8 text-cyan-400" />,
      description: 'Contas bancárias, configurações e preferências.',
      plannedFeatures: [
        'Gerenciamento de contas correntes e carteiras',
        'Notificações de vencimento e avisos de limite',
        'Configurações de segurança e biometria',
        'Backup local e opções de sincronização',
      ],
    },
  };

  if (tab === 'home') return null;

  const current = meta[tab];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* Icon pill */}
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
        {current.icon}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
        <Clock className="w-3.5 h-3.5" />
        <span>Próxima Etapa</span>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
      <p className="text-xs text-zinc-400 max-w-xs mb-6">{current.description}</p>

      {/* Planned items card */}
      <div className="w-full max-w-xs bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 text-left mb-6">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
          O que estará aqui:
        </span>
        <ul className="flex flex-col gap-2">
          {current.plannedFeatures.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        id="btn-return-home"
        type="button"
        onClick={onReturnHome}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors border border-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para o Início</span>
      </button>
    </div>
  );
};
