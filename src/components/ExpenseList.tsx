import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface EditExpenseModalProps {
  expense: any;
  onClose: () => void;
  onSave: () => void;
}

function EditExpenseModal({ expense, onClose, onSave }: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    name: expense.description || expense.name || "",
    amount: expense.amount.toString(),
    categoryId: expense.categoryId,
    date: expense.date,
    paymentMethod: expense.paymentMethod || "Dinheiro",
    description: expense.notes || "",
    tags: "",
    personId: expense.householdMemberId || "",
  });

  const categories = useQuery(api.categories.getUserCategories);
  const householdMembers = useQuery(api.householdMembers.getHouseholdMembers);
  const updateExpense = useMutation(api.expenses.updateExpense);

  const paymentMethods = [
    "Dinheiro",
    "Cartão de Débito", 
    "Cartão de Crédito",
    "PIX",
    "Transferência",
    "Boleto",
    "Outros"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tags = formData.tags 
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        : undefined;

      await updateExpense({
        expenseId: expense._id,
        description: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId as any,
        date: formData.date,
        householdMemberId: formData.personId ? (formData.personId as any) : undefined,
        notes: formData.description || undefined,
      });

      toast.success("Despesa atualizada com sucesso!");
      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar despesa");
      console.error(error);
    }
  };

  if (!categories || !householdMembers) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ✏️ Editar Despesa
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Despesa
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {categories.map((category) => (
                <option key={category._id || category.name} value={category._id || ""}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pessoa Responsável
            </label>
            <select
              value={formData.personId}
              onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Nenhuma pessoa específica</option>
              {householdMembers.map((person) => (
                <option key={person._id} value={person._id}>
                  👤 {person.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de Pagamento
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Separar por vírgula"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              💾 Salvar Alterações
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpenseList() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const expenses = useQuery(api.expenses.getExpenses, { month: currentMonth });
  const deleteExpense = useMutation(api.expenses.deleteExpense);

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

  const handleDelete = async (expenseId: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      try {
        await deleteExpense({ expenseId: expenseId as any });
        toast.success("Despesa excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir despesa");
        console.error(error);
      }
    }
  };

  const handleSave = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!expenses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            📋 Lista de Despesas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getMonthName(currentMonth)} • Total: {formatCurrency(totalExpenses)} • {expenses.length} despesa{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
        />
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {expenses.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((expense) => (
              <div key={expense._id} className="p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{expense.category?.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {expense.description || "Despesa sem nome"}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{expense.category?.name}</span>
                          <span>•</span>
                          <span>{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>Cartão</span>
                        </div>
                        {expense.householdMember && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            👤 {expense.householdMember.name}
                          </p>
                        )}
                        {expense.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {expense.notes}
                          </p>
                        )}
                        {false && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {[].map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded-full text-gray-600 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Editar despesa"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Excluir despesa"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-4">
              <span className="text-6xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma despesa encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa foi registrada para {getMonthName(currentMonth)}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
