import { Authenticated, Unauthenticated } from "convex/react";
import { EnhancedSignInForm } from "./components/EnhancedSignInForm";
import { SignOutButton } from "./SignOutButton";
import AppWrapper from "./AppWrapper";
import Logo from "./components/Logo";

function App() {
  return (
    <>
      <Authenticated>
        <AppWrapper />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: '#184cfc' }}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              {/* Floating circles */}
              <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
              <div className="absolute top-40 right-32 w-24 h-24 bg-white/15 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-32 left-32 w-40 h-40 bg-white/8 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/20 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 text-white w-full">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-28 h-28 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-2xl">
                  <Logo size="xl" />
                </div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  DomusFinance
                </h1>
                <p className="text-xl text-blue-100 max-w-md leading-relaxed">
                  Gerencie suas finanças domésticas com inteligência e simplicidade
                </p>
              </div>
              
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6 max-w-md">
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-sm font-medium text-blue-100">
                    Relatórios Inteligentes
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-sm font-medium text-blue-100">
                    Controle de Gastos
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <p className="text-sm font-medium text-blue-100">
                    Lista de Compras
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-sm font-medium text-blue-100">
                    Gastos Familiares
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-xl" style={{ background: '#184cfc' }}>
                  <Logo size="lg" />
                </div>
                <h1 className="text-3xl font-bold text-center" style={{ color: '#184cfc' }}>
                  DomusFinance
                </h1>
              </div>

              {/* Welcome Text */}
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Bem-vindo
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Entre na sua conta ou crie uma nova para começar a gerenciar suas finanças
                </p>
              </div>

              {/* Sign in form */}
              <EnhancedSignInForm />

              {/* Footer */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Seus dados são seguros e criptografados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}

export default App;
