import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Target, DollarSign, Calendar, FileText, Sparkles, ShieldCheck, Plane, Laptop, Home, Car } from 'lucide-react';
import { FinancialGoal } from '../../types';

interface FinancialGoalModalProps {
  isOpen: boolean;
  goalToEdit: FinancialGoal | null;
  onClose: () => void;
  onSave: (goal: Omit<FinancialGoal, 'id'> & { id?: string }) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const PRESET_ICONS = [
  { id: 'ShieldCheck', label: 'Reserva', icon: ShieldCheck, color: '#10B981' },
  { id: 'Plane', label: 'Viagem', icon: Plane, color: '#6366F1' },
  { id: 'Laptop', label: 'Equipamento', icon: Laptop, color: '#06B6D4' },
  { id: 'Home', label: 'Casa Própria', icon: Home, color: '#F59E0B' },
  { id: 'Car', label: 'Veículo', icon: Car, color: '#EC4899' },
  { id: 'Target', label: 'Objetivo', icon: Target, color: '#8B5CF6' },
];

export const FinancialGoalModal: React.FC<FinancialGoalModalProps> = ({
  isOpen,
  goalToEdit,
  onClose,
  onSave,
  onShowToast,
}) => {
  const isEditing = Boolean(goalToEdit);

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Target');
  const [selectedColor, setSelectedColor] = useState('#10B981');

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmountStr(goalToEdit.targetAmount.toString().replace('.', ','));
        setCurrentAmountStr(goalToEdit.currentAmount.toString().replace('.', ','));
        setDeadline(goalToEdit.deadline);
        setDescription(goalToEdit.description || '');
        setSelectedIcon(goalToEdit.icon || 'Target');
        setSelectedColor(goalToEdit.color || '#10B981');
      } else {
        setName('');
        setTargetAmountStr('');
        setCurrentAmountStr('0');
        setDeadline('Dezembro 2026');
        setDescription('');
        setSelectedIcon('ShieldCheck');
        setSelectedColor('#10B981');
      }
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onShowToast('Nome obrigatório', 'Dê um nome para sua meta financeira.', 'warning');
      return;
    }

    const parsedTarget = parseFloat(targetAmountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      onShowToast('Valor objetivo inválido', 'Informe um valor objetivo maior que zero.', 'warning');
      return;
    }

    const parsedCurrent = currentAmountStr ? parseFloat(currentAmountStr.replace(/\./g, '').replace(',', '.')) : 0;
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      onShowToast('Valor inicial inválido', 'O valor inicial não pode ser negativo.', 'warning');
      return;
    }

    if (!deadline.trim()) {
      onShowToast('Prazo obrigatório', 'Informe o prazo estimado para atingir a meta.', 'warning');
      return;
    }

    onSave({
      id: goalToEdit ? goalToEdit.id : undefined,
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline: deadline.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });

    onClose();
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

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditing ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Defina seu objetivo financeiro e monitore cada passo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-3">
              {/* Nome da Meta */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome da Meta <span className="text-rose-400">*</span>
                </label>
                <input
                  id="input-goal-name"
                  type="text"
                  placeholder="Ex: Reserva de emergência, Viagem para praia..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  autoFocus={!isEditing}
                />
              </div>

              {/* Escolha do Ícone e Cor */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ícone da Meta</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_ICONS.map(item => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedIcon(item.id);
                          setSelectedColor(item.color);
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 border-white/40 ring-1 ring-white/20'
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" style={{ color: item.color }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valores: Objetivo e Inicial */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Valor Objetivo <span className="text-rose-400">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      R$
                    </span>
                    <input
                      id="input-goal-target-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={targetAmountStr}
                      onChange={e => setTargetAmountStr(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-zinc-400" />
                    <span>Valor Atual</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      R$
                    </span>
                    <input
                      id="input-goal-current-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={currentAmountStr}
                      onChange={e => setCurrentAmountStr(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm font-semibold text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Prazo Estimado <span className="text-rose-400">*</span></span>
                </label>
                <input
                  id="input-goal-deadline"
                  type="text"
                  placeholder="Ex: Dezembro 2026, Julho 2027..."
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Descrição Opcional */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Descrição / Motivo (opcional)</span>
                </label>
                <textarea
                  id="input-goal-description"
                  rows={2}
                  placeholder="Ex: Guardar em CDB para liquidez diária ou comprar passagens..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Ações */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-financial-goal"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEditing ? 'Salvar Meta' : 'Criar Meta'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
