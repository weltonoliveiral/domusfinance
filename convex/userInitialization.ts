import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Categorias padrão
const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "🍽️", color: "#FF6B6B" },
  { name: "Transporte", icon: "🚗", color: "#4ECDC4" },
  { name: "Moradia", icon: "🏠", color: "#45B7D1" },
  { name: "Saúde", icon: "🏥", color: "#96CEB4" },
  { name: "Educação", icon: "📚", color: "#FFEAA7" },
  { name: "Lazer", icon: "🎮", color: "#DDA0DD" },
  { name: "Roupas", icon: "👕", color: "#98D8C8" },
  { name: "Outros", icon: "📦", color: "#A0A0A0" },
];

export const initializeUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Verificar se já foi inicializado
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) return; // Já foi inicializado

    // Criar configurações padrão
    await ctx.db.insert("userSettings", {
      userId,
      currency: "BRL",
      language: "pt-BR",
      theme: "light",
      notifications: {
        budgetAlerts: true,
        expenseReminders: true,
        monthlyReports: true,
        emailNotifications: true,
      },
    });

    // Criar categorias padrão
    for (const category of DEFAULT_CATEGORIES) {
      await ctx.db.insert("categories", {
        ...category,
        userId,
        isDefault: true,
      });
    }
  },
});
