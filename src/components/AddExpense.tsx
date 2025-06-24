import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

// Brasília timezone utilities for frontend
const getCurrentBrasiliaDate = () => {
  const now = new Date();
  const brasiliaDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return brasiliaDate.toISOString().split('T')[0];
};

const formatBrasiliaDateTime = (date: Date | string | number) => {
  const inputDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return inputDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function AddExpense() {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    categoryId: "",
    date: getCurrentBrasiliaDate(), // Use current Brasília date
    paymentMethod: "Dinheiro",
    description: "",
    tags: "",
    personId: "",
  });

  const categories = useQuery(api.categories.getUserCategories);
  const householdMembers = useQuery(api.householdMembers.getHouseholdMembers);
  const createExpense = useMutation(api.expenses.createExpense);

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
    
    if (!formData.name || !formData.amount || !formData.categoryId) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const tags = formData.tags 
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        : undefined;

      await createExpense({
        description: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId as any,
        date: formData.date, // This will be in Brasília timezone
        householdMemberId: formData.personId ? (formData.personId as any) : undefined,
        notes: formData.description || undefined,
      });

      const currentTime = formatBrasiliaDateTime(new Date());
      toast.success(`Despesa adicionada com sucesso! (${currentTime} - Horário de Brasília)`);
      
      // Reset form
      setFormData({
        name: "",
        amount: "",
        categoryId: "",
        date: getCurrentBrasiliaDate(),
        paymentMethod: "Dinheiro",
        description: "",
        tags: "",
        personId: "",
      });
    } catch (error) {
      toast.error("Erro ao adicionar despesa");
      console.error(error);
    }
  };

  if (!categories || !householdMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ➕ Adicionar Despesa
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Registre uma nova despesa • Horário de Brasília: {formatBrasiliaDateTime(new Date())}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Despesa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Supermercado, Gasolina, Almoço..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category._id || category.name} value={category._id || ""}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data (Horário de Brasília) *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pessoa Responsável
              </label>
              <select
                value={formData.personId}
                onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pagamento
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detalhes adicionais sobre a despesa..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Separar por vírgula (ex: urgente, trabalho, casa)"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                name: "",
                amount: "",
                categoryId: "",
                date: getCurrentBrasiliaDate(),
                paymentMethod: "Dinheiro",
                description: "",
                tags: "",
                personId: "",
              })}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Limpar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              💾 Adicionar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
