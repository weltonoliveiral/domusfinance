import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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

export const getUserCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Se não há categorias, criar as padrão
    if (categories.length === 0) {
      return DEFAULT_CATEGORIES.map(cat => ({ ...cat, _id: null, userId, isDefault: true }));
    }

    return categories;
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    return await ctx.db.insert("categories", {
      name: args.name,
      icon: args.icon,
      color: args.color,
      userId,
      isDefault: false,
    });
  },
});

export const initializeDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Verificar se já existem categorias
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingCategories.length > 0) return;

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
