import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import Logo from "./Logo";

export default function PasswordResetPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const validateResetToken = useMutation(api.passwordReset.validateResetToken);
  const resetPassword = useMutation(api.passwordReset.resetPassword);
  const { signIn } = useAuthActions();

  // Get token from URL
  const token = new URLSearchParams(window.location.search).get('token');

  const navigate = (path: string) => {
    if ((window as any).navigate) {
      (window as any).navigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.location.reload();
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setValidating(false);
        return;
      }

      try {
        const result = await validateResetToken({ token });
        setTokenValid(true);
        setEmail(result.email);
      } catch (error: any) {
        setTokenValid(false);
        toast.error(error.message || "Token inválido ou expirado");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, validateResetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!token) {
      toast.error("Token inválido");
      return;
    }

    setSubmitting(true);
    try {
      // First mark the token as used
      await resetPassword({ token, newPassword: password });
      
      // Then try to sign in with the new password
      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("password", password);
        formData.set("flow", "signIn");
        
        await signIn("password", formData);
        
        toast.success("Senha redefinida com sucesso! Você foi conectado automaticamente.");
        setResetComplete(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (signInError) {
        // If auto sign-in fails, still show success and redirect to login
        toast.success("Senha redefinida com sucesso! Você pode fazer login agora.");
        setResetComplete(true);
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl" style={{ background: '#184cfc' }}>
              <Logo size="lg" />
            </div>
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 mx-auto"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Validando token de redefinição...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl" style={{ background: '#184cfc' }}>
              <Logo size="lg" />
            </div>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Link Inválido ou Expirado
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              O link de redefinição de senha é inválido ou já expirou. Links de redefinição são válidos por apenas 1 hora.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                🏠 Voltar ao Login
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Precisa de um novo link? Solicite novamente na tela de login.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl" style={{ background: '#184cfc' }}>
              <Logo size="lg" />
            </div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Senha Redefinida!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sua senha foi redefinida com sucesso. Redirecionando...
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl" style={{ background: '#184cfc' }}>
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔐 Redefinir Senha
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Digite sua nova senha para <strong>{email}</strong>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Digite sua nova senha"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirme sua nova senha"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  As senhas não coincidem
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || password !== confirmPassword || password.length < 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Redefinindo senha...
              </span>
            ) : (
              "🔑 Redefinir Senha"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              ← Voltar ao login
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 dark:text-blue-400 text-lg">🛡️</span>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Dica de Segurança
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Use uma senha forte com pelo menos 8 caracteres, incluindo letras, números e símbolos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
