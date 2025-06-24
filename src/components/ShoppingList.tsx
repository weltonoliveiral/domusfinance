import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function ShoppingList() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showNewList, setShowNewList] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const [newList, setNewList] = useState({
    name: "",
    totalBudget: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Alimentação",
    estimatedPrice: "",
    quantity: "1",
    unit: "unidade",
    notes: "",
  });

  const shoppingList = useQuery(api.shoppingLists.getShoppingListByMonth, { monthYear: currentMonth });
  const shoppingItems = useQuery(api.shoppingLists.getShoppingItems, 
    shoppingList && typeof shoppingList === 'object' && '_id' in shoppingList ? { listId: (shoppingList as any)._id } : "skip"
  );

  const createShoppingList = useMutation(api.shoppingLists.createShoppingList);
  const addShoppingItem = useMutation(api.shoppingLists.addShoppingItem);
  const toggleItemPurchased = useMutation(api.shoppingLists.toggleItemPurchased);
  const deleteShoppingItem = useMutation(api.shoppingLists.deleteShoppingItem);

  const itemCategories = [
    "Alimentação", "Limpeza", "Higiene", "Bebidas", "Carnes", "Laticínios",
    "Frutas e Verduras", "Padaria", "Congelados", "Outros"
  ];

  const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "lata"];

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

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newList.name || !newList.totalBudget) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await createShoppingList({
        name: newList.name,
        monthYear: currentMonth,
        totalBudget: parseFloat(newList.totalBudget),
      });

      toast.success("Lista criada com sucesso!");
      setShowNewList(false);
      setNewList({ name: "", totalBudget: "" });
    } catch (error) {
      toast.error("Erro ao criar lista");
      console.error(error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shoppingList || !newItem.name || !newItem.estimatedPrice) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await addShoppingItem({
        listId: (shoppingList as any)?._id,
        name: newItem.name,
        category: newItem.category,
        estimatedPrice: parseFloat(newItem.estimatedPrice),
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        notes: newItem.notes || undefined,
      });

      toast.success("Item adicionado com sucesso!");
      setShowNewItem(false);
      setNewItem({
        name: "",
        category: "Alimentação",
        estimatedPrice: "",
        quantity: "1",
        unit: "unidade",
        notes: "",
      });
    } catch (error) {
      toast.error("Erro ao adicionar item");
      console.error(error);
    }
  };

  const handleToggleItemPurchased = async (itemId: string, isPurchased: boolean) => {
    try {
      await toggleItemPurchased({
        itemId: itemId as any,
        isPurchased: !isPurchased,
      });
    } catch (error) {
      toast.error("Erro ao atualizar item");
      console.error(error);
    }
  };

  if (shoppingList === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            🛒 Lista de Compras - {getMonthName(currentMonth)}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
          />
          {!shoppingList && (
            <button
              onClick={() => setShowNewList(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              + Nova Lista
            </button>
          )}
        </div>
      </div>

      {/* Modal Nova Lista */}
      {showNewList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nova Lista de Compras
            </h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <input
                type="text"
                value={newList.name}
                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                placeholder="Nome da lista (ex: Compras do mês)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={newList.totalBudget}
                onChange={(e) => setNewList({ ...newList, totalBudget: e.target.value })}
                placeholder="Orçamento total (R$)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                required
              />
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Criar Lista
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewList(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Item */}
      {showNewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Adicionar Item
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Nome do item"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                required
              />
              
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                {itemCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.estimatedPrice}
                  onChange={(e) => setNewItem({ ...newItem, estimatedPrice: e.target.value })}
                  placeholder="Preço estimado"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                  required
                />
                <div className="flex space-x-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="Qtd"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    required
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Observações (opcional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base resize-none"
              />

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  Adicionar Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewItem(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Compras */}
      <div className="space-y-4 sm:space-y-6">
        {shoppingList ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {(shoppingList as any)?.name || 'Lista de Compras'}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-0">
                    <span>Orçamento: {formatCurrency((shoppingList as any)?.totalBudget || 0)}</span>
                    {shoppingItems && (
                      <>
                        <span>Itens: {(shoppingItems || []).length}</span>
                        <span>Comprados: {(shoppingItems || []).filter((item: any) => item.isPurchased).length}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowNewItem(true)}
                    className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Item
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {shoppingItems && shoppingItems.length > 0 ? (
                <div className="space-y-3">
                  {(shoppingItems || []).map((item: any) => (
                    <div
                      key={item._id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.isPurchased
                          ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.isPurchased}
                          onChange={() => handleToggleItemPurchased(item._id, item.isPurchased)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className={`flex-1 min-w-0 ${item.isPurchased ? 'line-through opacity-60' : ''}`}>
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                            {item.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {item.category} • {item.quantity} {item.unit}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {formatCurrency((item.actualPrice || item.estimatedPrice) * item.quantity)}
                        </p>
                        {item.actualPrice && item.actualPrice !== item.estimatedPrice && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            {formatCurrency(item.estimatedPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm sm:text-base">
                  Nenhum item adicionado ainda
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 text-center">
            <div className="mb-4">
              <span className="text-4xl sm:text-6xl">🛒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma lista de compras criada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">
              Crie sua primeira lista de compras para organizar suas compras do mês
            </p>
            <button
              onClick={() => setShowNewList(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Criar Primeira Lista
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
