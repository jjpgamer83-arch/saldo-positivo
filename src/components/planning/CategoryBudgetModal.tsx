import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Tag, DollarSign, FileText } from 'lucide-react';
import { Category, CategoryBudget } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { formatCurrency, getCurrencySymbol } from '../../utils/formatters';

interface CategoryBudgetModalProps {
  isOpen: boolean;
  categoryBudget: CategoryBudget | null;
  categories: Category[];
  existingCategoryIds: string[];
  onClose: () => void;
  onSave: (data: {
    id?: string;
    categoryId: string;
    limit: number;
    spent: number;
    observation?: string;
  }) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  isOpen,
  categoryBudget,
  categories,
  existingCategoryIds,
  onClose,
  onSave,
  onShowToast,
}) => {
  const isEditing = Boolean(categoryBudget);

  const [categoryId, setCategoryId] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [spentStr, setSpentStr] = useState('');
  const [observation, setObservation] = useState('');

  // Filter available expense categories
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  useEffect(() => {
    if (isOpen) {
      if (categoryBudget) {
        setCategoryId(categoryBudget.categoryId);
        setLimitStr(categoryBudget.limit.toString().replace('.', ','));
        setSpentStr(categoryBudget.spent.toString().replace('.', ','));
        setObservation(categoryBudget.observation || '');
      } else {
        // Pick first available category that is not yet budgeted
        const available = expenseCategories.find(c => !existingCategoryIds.includes(c.id));
        setCategoryId(available ? available.id : (expenseCategories[0]?.id || 'moradia'));
        setLimitStr('');
        setSpentStr('0');
        setObservation('');
      }
    }
  }, [isOpen, categoryBudget, categories, existingCategoryIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      onShowToast('Categoria obrigatória', 'Selecione a categoria para definir o orçamento.', 'warning');
      return;
    }

    const parsedLimit = parseFloat(limitStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      onShowToast('Limite inválido', 'Informe um valor de limite maior que zero.', 'warning');
      return;
    }

    const parsedSpent = spentStr ? parseFloat(spentStr.replace(/\./g, '').replace(',', '.')) : 0;
    if (isNaN(parsedSpent) || parsedSpent < 0) {
      onShowToast('Valor utilizado inválido', 'O valor utilizado não pode ser negativo.', 'warning');
      return;
    }

    onSave({
      id: categoryBudget ? categoryBudget.id : undefined,
      categoryId,
      limit: parsedLimit,
      spent: parsedSpent,
      observation: observation.trim() || undefined,
    });

    onClose();
  };

  const selectedCategoryObj = categories.find(c => c.id === categoryId);

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
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditing ? 'Editar Orçamento da Categoria' : 'Novo Orçamento por Categoria'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Defina um teto de gastos mensal para controlar suas despesas
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
              {/* Seleção de Categoria */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Categoria</span>
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  {expenseCategories.map(cat => {
                    const isSelected = categoryId === cat.id;
                    const isAlreadyUsed = !isEditing && existingCategoryIds.includes(cat.id);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={isAlreadyUsed}
                        onClick={() => setCategoryId(cat.id)}
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 border-white/30 text-white shadow-sm ring-1 ring-white/10'
                            : isAlreadyUsed
                            ? 'opacity-40 bg-zinc-950/30 border-zinc-900 cursor-not-allowed text-zinc-600'
                            : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.bgLight, color: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-medium truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedCategoryObj && (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Selecionada: <span className="text-zinc-300 font-medium">{selectedCategoryObj.name}</span>
                  </p>
                )}
              </div>

              {/* Limite Mensal */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Limite Mensal ({getCurrencySymbol()}) <span className="text-rose-400">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 font-mono">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    id="input-category-budget-limit"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={limitStr}
                    onChange={e => setLimitStr(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                    autoFocus={!isEditing}
                  />
                </div>
              </div>

              {/* Valor Já Utilizado (Apenas se estiver editando ou customizando) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Valor já utilizado ({getCurrencySymbol()})</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">Gasto no mês atual</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 font-mono">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    id="input-category-budget-spent"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={spentStr}
                    onChange={e => setSpentStr(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Observação / Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Observação (opcional)</span>
                </label>
                <textarea
                  id="input-category-budget-observation"
                  rows={2}
                  placeholder="Ex: Inclui supermercado e compras a granel..."
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
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
                  id="btn-submit-category-budget"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
