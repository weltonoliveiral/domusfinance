import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Reports() {
  const [filters, setFilters] = useState({
    startMonth: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 2);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })(),
    endMonth: (() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })(),
    categoryId: "",
  });

  const categories = useQuery(api.categories.getUserCategories);
  const currentMonthExpenses = useQuery(api.expenses.getExpenses, { 
    month: filters.endMonth 
  });
  const previousMonthExpenses = useQuery(api.expenses.getExpenses, { 
    month: (() => {
      const [year, month] = filters.endMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 2);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })()
  });

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

  const exportToPDF = () => {
    // Implementação básica de exportação
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Despesas - SmartHouse Finance</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>🏠 SmartHouse Finance - Relatório de Despesas</h1>
            <div class="summary">
              <h2>Resumo do Período</h2>
              <p><strong>Período:</strong> ${getMonthName(filters.startMonth)} a ${getMonthName(filters.endMonth)}</p>
              <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <p>Relatório gerado automaticamente pelo SmartHouse Finance</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToCSV = () => {
    if (!currentMonthExpenses) return;

    const csvContent = [
      ['Data', 'Nome', 'Categoria', 'Valor', 'Método de Pagamento', 'Descrição'].join(','),
      ...currentMonthExpenses.map(expense => [
        expense.date,
        `"${expense.description || 'Despesa sem nome'}"`,
        `"${expense.category?.name || ''}"`,
        expense.amount.toString().replace('.', ','),
        `"Cartão"`,
        `"${expense.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `despesas_${filters.endMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!categories || !currentMonthExpenses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calcular estatísticas
  const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previousMonthExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const monthlyChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  // Agrupar por categoria
  const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Outros';
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, count: 0, category: expense.category };
    }
    acc[categoryName].total += expense.amount;
    acc[categoryName].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; category: any }>);

  // Agrupar por método de pagamento
  const paymentMethodTotals = currentMonthExpenses.reduce((acc, expense) => {
    const paymentMethod = "Cartão";
    if (!acc[paymentMethod]) {
      acc[paymentMethod] = { total: 0, count: 0 };
    }
    acc[paymentMethod].total += expense.amount;
    acc[paymentMethod].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📈 Relatórios e Análises
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            📄 Exportar PDF
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filtros de Análise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mês Inicial
            </label>
            <input
              type="month"
              value={filters.startMonth}
              onChange={(e) => setFilters({ ...filters, startMonth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mês Final
            </label>
            <input
              type="month"
              value={filters.endMonth}
              onChange={(e) => setFilters({ ...filters, endMonth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category._id || category.name} value={category._id || ""}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total do Mês</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Variação Mensal</p>
              <p className={`text-2xl font-bold ${
                monthlyChange >= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Média por Despesa</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentMonthExpenses.length > 0 ? currentTotal / currentMonthExpenses.length : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Análise por Categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise por Categoria
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(categoryTotals)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([categoryName, data]) => {
                const percentage = currentTotal > 0 ? (data.total / currentTotal) * 100 : 0;
                return (
                  <div key={categoryName} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{data.category?.icon || '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {categoryName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.count} despesa{data.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(data.total)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Análise por Método de Pagamento */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise por Método de Pagamento
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(paymentMethodTotals)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([method, data]) => {
                const percentage = currentTotal > 0 ? (data.total / currentTotal) * 100 : 0;
                return (
                  <div key={method} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {method}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.count} transaç{data.count !== 1 ? 'ões' : 'ão'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(data.total)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Lista Detalhada de Despesas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Despesas Detalhadas - {getMonthName(filters.endMonth)}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Despesa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentMonthExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.description || "Despesa sem nome"}
                      </div>
                      {expense.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{expense.category?.icon}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {expense.category?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    Cartão
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
