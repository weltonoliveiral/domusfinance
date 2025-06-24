import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function Budgets() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showNewBudget, setShowNewBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    categoryId: "",
    limit: "",
  });

  const budgets = useQuery(api.budgets.getBudgets, { month: currentMonth });
  const categories = useQuery(api.categories.getUserCategories);
  const createBudget = useMutation(api.budgets.createBudget);
  const updateBudget = useMutation(api.budgets.updateBudget);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget.categoryId || !newBudget.limit) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await createBudget({
        categoryId: newBudget.categoryId as any,
        month: currentMonth,
        limit: parseFloat(newBudget.limit),
      });

      toast.success("Orçamento criado com sucesso!");
      setShowNewBudget(false);
      setNewBudget({ categoryId: "", limit: "" });
    } catch (error) {
      toast.error("Erro ao criar orçamento");
      console.error(error);
    }
  };

  if (!budgets || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          💰 Orçamentos - {getMonthName(currentMonth)}
        </h2>
        <div className="flex space-x-2">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setShowNewBudget(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Novo Orçamento
          </button>
        </div>
      </div>

      {/* Modal Novo Orçamento */}
      {showNewBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Novo Orçamento
            </h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <select
                value={newBudget.categoryId}
                onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category._id || category.name} value={category._id || ""}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newBudget.limit}
                onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                placeholder="Limite do orçamento (R$)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Criar Orçamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBudget(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Orçamentos */}
      <div className="space-y-4">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const percentage = budget.spent > 0 ? (budget.spent / budget.limit) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            return (
              <div key={budget._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {budget.category?.icon} {budget.category?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Restante: {formatCurrency(Math.max(0, budget.limit - budget.spent))}
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      isOverBudget ? 'bg-red-600' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                
                {isOverBudget && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    ⚠️ Orçamento excedido em {formatCurrency(budget.spent - budget.limit)}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nenhum orçamento definido para este mês
            </p>
            <button
              onClick={() => setShowNewBudget(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Primeiro Orçamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
