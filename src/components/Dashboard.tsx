import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Brasília timezone utilities for frontend
const formatBrasiliaDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
  const inputDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return inputDate.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...options
  });
};

const formatBrasiliaDateTime = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
  const inputDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return inputDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...options
  });
};

const getCurrentBrasiliaMonth = () => {
  const now = new Date();
  const brasiliaDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return `${brasiliaDate.getFullYear()}-${String(brasiliaDate.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentBrasiliaMonth);
  const [chartPeriod, setChartPeriod] = useState("days");
  const [chartTimeRange, setChartTimeRange] = useState(30);

  const monthlyExpenses = useQuery(api.expenses.getMonthlyExpensesSummary, { month: currentMonth });
  const budgets = useQuery(api.budgets.getBudgets, { month: currentMonth });
  const savingsGoals = useQuery(api.savingsGoals.getUserSavingsGoals);
  const expensesByPerson = useQuery(api.householdMembers.getExpensesByPerson, { month: currentMonth });
  
  // Fetch recent expenses for the activity section
  const recentExpenses = useQuery(api.expenses.getRecentExpenses, { limit: 5 });

  // Fetch chart data
  const chartData = useQuery(api.expenses.getExpenseChartData, { 
    period: chartPeriod as "days" | "weeks" | "months" | "year", 
    timeRange: chartTimeRange 
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
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const handleViewAllBudgets = () => {
    const event = new CustomEvent('switchTab', { detail: 'budgets' });
    window.dispatchEvent(event);
  };

  const handleViewAllExpenses = () => {
    const event = new CustomEvent('switchTab', { detail: 'expenses' });
    window.dispatchEvent(event);
  };

  const handleViewReports = () => {
    const event = new CustomEvent('switchTab', { 
      detail: JSON.stringify({ 
        tab: 'reports', 
        period: chartPeriod, 
        timeRange: chartTimeRange 
      })
    });
    window.dispatchEvent(event);
  };

  const getPeriodOptions = () => {
    switch (chartPeriod) {
      case "days":
        return [7, 15, 30, 60, 90];
      case "weeks":
        return [4, 8, 12, 24, 52];
      case "months":
        return [3, 6, 12, 18, 24];
      case "year":
        return [2, 3, 5, 10];
      default:
        return [30];
    }
  };

  const getPeriodLabel = () => {
    switch (chartPeriod) {
      case "days":
        return "dias";
      case "weeks":
        return "semanas";
      case "months":
        return "meses";
      case "year":
        return "anos";
      default:
        return "períodos";
    }
  };

  if (!monthlyExpenses || !budgets) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  const topCategory = monthlyExpenses.categoryBreakdown.length > 0 
    ? monthlyExpenses.categoryBreakdown.reduce((prev, current) => 
        prev.total > current.total ? prev : current
      )
    : null;

  // Calculate dynamic progress percentages based on data
  const calculateProgressPercentage = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.min((value / maxValue) * 100, 100);
  };

  // Get maximum values for comparison
  const maxExpenseAmount = Math.max(monthlyExpenses.totalExpenses, 5000);
  const maxExpenseCount = Math.max(monthlyExpenses.expenseCount, 50);
  const maxDailyAverage = Math.max(monthlyExpenses.dailyAverage, 200);

  // Calculate progress percentages
  const expenseAmountProgress = calculateProgressPercentage(monthlyExpenses.totalExpenses, maxExpenseAmount);
  const expenseCountProgress = calculateProgressPercentage(monthlyExpenses.expenseCount, maxExpenseCount);
  const dailyAverageProgress = calculateProgressPercentage(monthlyExpenses.dailyAverage, maxDailyAverage);

  // Sort budgets by percentage (highest usage first) and limit to 5 items
  const sortedBudgets = budgets
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Ensure we have exactly 5 items for both sections
  const displayExpenses = recentExpenses ? recentExpenses.slice(0, 5) : [];
  const displayBudgets = sortedBudgets;

  // Enhanced tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 backdrop-blur-sm max-w-xs">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium truncate">{label}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].value === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Nenhum gasto registrado
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate tick interval for X-axis based on data length and screen size
  const getTickInterval = () => {
    if (!chartData || chartData.length === 0) return 0;
    
    const dataLength = chartData.length;
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      if (dataLength <= 7) return 1; // Show every other tick on mobile
      if (dataLength <= 15) return 2; // Show every 3rd tick
      if (dataLength <= 30) return Math.floor(dataLength / 5); // Show ~5 ticks
      return Math.floor(dataLength / 4); // Show ~4 ticks for longer periods
    }
    
    if (dataLength <= 7) return 0; // Show all ticks on desktop
    if (dataLength <= 15) return 1; // Show every other tick
    if (dataLength <= 30) return Math.floor(dataLength / 7); // Show ~7 ticks
    return Math.floor(dataLength / 10); // Show ~10 ticks for longer periods
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
              {getMonthName(currentMonth)} • Horário de Brasília
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Expense Evolution Chart - Full Width */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col space-y-3 sm:space-y-4 p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg sm:text-xl">📈</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Evolução dos Gastos
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Visualização completa e contínua dos seus gastos ao longo do tempo
                </p>
              </div>
            </div>
            
            <button
              onClick={handleViewReports}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0"
            >
              Ver Relatórios Detalhados
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Período:
              </label>
              <select
                value={chartPeriod}
                onChange={(e) => {
                  setChartPeriod(e.target.value);
                  // Reset time range when period changes with better defaults
                  const defaultRanges = { days: 30, weeks: 12, months: 12, year: 3 };
                  setChartTimeRange(defaultRanges[e.target.value as keyof typeof defaultRanges] || 30);
                }}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              >
                <option value="days">Dias</option>
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
                <option value="year">Anos</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Últimos:
              </label>
              <select
                value={chartTimeRange}
                onChange={(e) => setChartTimeRange(parseInt(e.target.value))}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              >
                {getPeriodOptions().map(option => (
                  <option key={option} value={option}>
                    {option} {getPeriodLabel()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="h-64 sm:h-80 lg:h-96 w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData} 
                  margin={{ 
                    top: 10, 
                    right: 10, 
                    left: 5, 
                    bottom: 20 
                  }}
                  className="cursor-pointer"
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="#93C5FD" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#DBEAFE" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="none" 
                    stroke="#F3F4F6" 
                    className="dark:stroke-gray-700" 
                    opacity={0.6}
                    horizontal={true}
                    vertical={false}
                    strokeWidth={1}
                  />
                  <XAxis 
                    dataKey="label" 
                    stroke="transparent"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval={getTickInterval()}
                    tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 400 }}
                    className="text-xs"
                    height={30}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="transparent"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value === 0) return 'R$ 0';
                      if (value >= 1000) {
                        return `R$ ${(value / 1000).toFixed(0)}k`;
                      }
                      return `R$ ${value.toFixed(0)}`;
                    }}
                    domain={[0, 'dataMax']}
                    tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 400 }}
                    width={45}
                    tickCount={4}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={false}
                    animationDuration={150}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorAmount)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      stroke: '#3B82F6',
                      strokeWidth: 2,
                      fill: '#FFFFFF',
                      style: { filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }
                    }}
                    connectNulls={true}
                    animationDuration={1200}
                    animationBegin={0}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <span className="text-2xl sm:text-3xl">📈</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Carregando dados do gráfico...
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    Preparando visualização completa dos seus gastos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="group">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-red-100 text-xs sm:text-sm font-medium">Total de Gastos</p>
                <p className="text-lg sm:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(monthlyExpenses.totalExpenses)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <span className="text-xl sm:text-2xl">💸</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <div className="w-full bg-red-400 bg-opacity-30 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${expenseAmountProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Número de Gastos</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">
                  {monthlyExpenses.expenseCount}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <span className="text-xl sm:text-2xl">📊</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${expenseCountProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Média Diária</p>
                <p className="text-lg sm:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(monthlyExpenses.dailyAverage)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <span className="text-xl sm:text-2xl">📅</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <div className="w-full bg-green-400 bg-opacity-30 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${dailyAverageProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Maior Categoria</p>
                <p className="text-sm sm:text-lg font-bold mt-1 truncate">
                  {topCategory?.category?.name || "Nenhuma"}
                </p>
                <p className="text-xs sm:text-sm text-purple-200 truncate">
                  {topCategory ? formatCurrency(topCategory.total) : "R$ 0,00"}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <span className="text-xl sm:text-2xl">{topCategory?.category?.icon || "📦"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Fixed Height Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Activity - Latest Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-[500px] sm:h-[600px]">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Atividade Recente
            </h3>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleViewAllExpenses}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Ver Todos
              </button>
            </div>
          </div>
          
          <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 overflow-hidden">
            {displayExpenses.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto">
                {displayExpenses.map((expense, index) => (
                  <div key={expense._id} className="group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 border border-gray-100 dark:border-gray-600 min-h-[72px] sm:min-h-[88px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${expense.category?.color}20` }}>
                          <span className="text-lg sm:text-xl">{expense.category?.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                            {expense.description || "Despesa sem nome"}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1 sm:space-y-0">
                            <span className="truncate">{expense.category?.name}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">{formatBrasiliaDate(expense.date)}</span>
                            {expense.householdMember && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate">{expense.householdMember.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2 sm:ml-4">
                        <p className="font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: expense.category?.color }}>
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatBrasiliaDateTime(expense._creationTime, { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">📈</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    Nenhuma despesa registrada ainda
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget Status - Ordered by highest usage percentage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-[500px] sm:h-[600px]">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Status dos Orçamentos
            </h3>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleViewAllBudgets}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Ver Todos
              </button>
            </div>
          </div>
          
          <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 overflow-hidden">
            {displayBudgets.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto">
                {displayBudgets.map((budget, index) => (
                  <div key={budget._id} className="group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 min-h-[72px] sm:min-h-[88px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-200 dark:text-gray-600" />
                            <circle cx="24" cy="24" r="20" strokeWidth="2" fill="none" strokeDasharray="125.66" strokeDashoffset={125.66 * (1 - Math.min(budget.percentage, 100) / 100)} className="transition-all duration-500 ease-out" strokeLinecap="round" stroke={budget.status === 'exceeded' ? '#ef4444' : budget.status === 'warning' ? '#eab308' : budget.status === 'caution' ? '#f97316' : '#22c55e'} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-base sm:text-lg">{budget.category?.icon}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                            {budget.category?.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2 sm:ml-4">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                          budget.status === 'exceeded' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          budget.status === 'caution' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">💰</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    Nenhum orçamento definido para este mês
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
