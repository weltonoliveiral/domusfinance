import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

// Import components
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import Budgets from './components/Budgets';
import HouseholdExpenses from './components/HouseholdExpenses';
import ShoppingList from './components/ShoppingList';
import Reports from './components/Reports';
import Settings from './components/Settings';
import NotificationBell from './components/NotificationBell';
import NotificationCenter from './components/NotificationCenter';

import Logo from './components/Logo';

export default function AppWrapper() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [showNotifications, setShowNotifications] = useState(false);

  const user = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.userProfile.getUserProfile);
  const profilePictureUrl = useQuery(api.userProfile.getProfilePictureUrl, 
    profile?.profilePicture ? { storageId: profile.profilePicture as any } : "skip"
  );
  const initializeUser = useMutation(api.userInitialization.initializeUserData);
  const notifications = useQuery(api.notifications.getUserNotifications, { limit: 10 });

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Inicializar dados do usuário quando ele fizer login
  useEffect(() => {
    if (user) {
      initializeUser().catch(console.error);
    }
  }, [user, initializeUser]);

  // Listen for custom events to switch tabs
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      let tabToSwitch = event.detail;
      
      // Handle JSON string format from Dashboard reports button
      if (typeof event.detail === 'string' && event.detail.startsWith('{')) {
        try {
          const parsed = JSON.parse(event.detail);
          tabToSwitch = parsed.tab || event.detail;
        } catch {
          // If parsing fails, use the original detail
          tabToSwitch = event.detail;
        }
      }
      
      setActiveTab(tabToSwitch);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'add-expense', name: 'Adicionar Gasto', icon: '➕' },
    { id: 'expenses', name: 'Despesas', icon: '💸' },
    { id: 'budgets', name: 'Orçamentos', icon: '💰' },
    { id: 'household', name: 'Gastos Familiares', icon: '👥' },
    { id: 'shopping', name: 'Lista de Compras', icon: '🛒' },
    { id: 'reports', name: 'Relatórios', icon: '📊' },
    { id: 'notifications', name: 'Notificações', icon: '🔔' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-expense':
        return <AddExpense />;
      case 'expenses':
        return <ExpenseList />;
      case 'budgets':
        return <Budgets />;
      case 'household':
        return <HouseholdExpenses />;
      case 'shopping':
        return <ShoppingList />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Notificações
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Acompanhe seus alertas e lembretes
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          notification.isRead 
                            ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50' 
                            : notification.type === 'budget_alert' && notification.priority === 'high'
                              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                              : notification.type === 'budget_alert' && notification.priority === 'medium'
                                ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                                : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl flex-shrink-0">
                            {notification.type === 'budget_alert' 
                              ? notification.priority === 'high' ? '🚨' : '⚠️'
                              : '🔔'
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(notification._creationTime).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
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
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhuma notificação
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você receberá alertas sobre orçamentos e lembretes aqui
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Get user's first name for greeting
  const getUserFirstName = () => {
    if (!user?.email) return 'Usuário';
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  // Generate user avatar initials
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase();
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Toaster position="top-right" richColors />
        
        {/* Sidebar */}
        <nav 
          className={`h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-20' : 'w-72'
          }`} 
          style={{ backgroundColor: '#1339bd' }}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-blue-400 border-opacity-30 flex-shrink-0">
            <div className="flex items-center justify-center">
              <Logo size="lg" className={`${sidebarCollapsed ? 'mr-0' : 'mr-3'} transition-all duration-300`} />
              <h1 
                className={`text-2xl font-bold text-white transition-all duration-300 overflow-hidden ${
                  sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                DomusFinance
              </h1>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-blue-400 border-opacity-30 flex-shrink-0 relative">
            <div className={`flex ${sidebarCollapsed ? 'flex-col' : 'flex-col'} items-center text-center transition-all duration-300`}>
              {/* User Avatar */}
              <div className="flex items-center justify-center mb-4 relative">
                <div className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'} rounded-full overflow-hidden border-2 border-white border-opacity-30 bg-white bg-opacity-20 transition-all duration-300`}>
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`${sidebarCollapsed ? 'text-lg' : 'text-2xl'} font-bold text-white transition-all duration-300`}>
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                </div>
              </div>
              
              {/* Greeting and Toggle Button Container */}
              <div className={`w-full transition-all duration-300 ${sidebarCollapsed ? 'space-y-3' : ''}`}>
                {/* Greeting */}
                <div 
                  className={`transition-all duration-300 overflow-hidden ${
                    sidebarCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
                  }`}
                >
                  <p className="text-blue-100 text-sm font-medium mb-1">
                    Bem-vindo de volta
                  </p>
                  <p className="text-white font-semibold text-lg">
                    {getUserFirstName()}
                  </p>
                </div>

                {/* Toggle Button */}
                <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-center'} transition-all duration-300`}>
                  <button
                    onClick={toggleSidebar}
                    className={`w-6 h-6 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-200 shadow-lg border border-blue-100 transform hover:scale-110 ${
                      sidebarCollapsed ? 'mt-1' : 'mt-3'
                    }`}
                    title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                  >
                    <svg className={`w-3 h-3 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 text-left rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30 shadow-lg'
                        : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <span 
                      className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        sidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-4'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    {menuItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-4">
                  <NotificationBell />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
