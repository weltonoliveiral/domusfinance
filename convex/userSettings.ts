import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    let settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Se não existir configurações, retornar configurações padrão
    if (!settings) {
      return {
        userId,
        currency: "BRL",
        language: "pt-BR",
        theme: "light",
        notifications: {
          budgetAlerts: true,
          expenseReminders: true,
          monthlyReports: true,
        },
        _id: null as any,
        _creationTime: Date.now(),
      };
    }

    return settings;
  },
});

export const initializeUserSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Verificar se já existem configurações
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) return existingSettings._id;

    // Criar configurações padrão
    return await ctx.db.insert("userSettings", {
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
  },
});

export const updateUserSettings = mutation({
  args: {
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    theme: v.optional(v.string()),
    notifications: v.optional(v.object({
      budgetAlerts: v.boolean(),
      expenseReminders: v.boolean(),
      monthlyReports: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    let settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      // Criar configurações se não existirem
      return await ctx.db.insert("userSettings", {
        userId,
        currency: args.currency || "BRL",
        language: args.language || "pt-BR",
        theme: args.theme || "light",
        notifications: {
          budgetAlerts: args.notifications?.budgetAlerts ?? true,
          expenseReminders: args.notifications?.expenseReminders ?? true,
          monthlyReports: args.notifications?.monthlyReports ?? true,
          emailNotifications: (args.notifications as any)?.emailNotifications ?? true,
        },
      });
    } else {
      // Atualizar configurações existentes
      const updates: any = {};
      if (args.currency !== undefined) updates.currency = args.currency;
      if (args.language !== undefined) updates.language = args.language;
      if (args.theme !== undefined) updates.theme = args.theme;
      if (args.notifications !== undefined) updates.notifications = args.notifications;

      await ctx.db.patch(settings._id, updates);
      return settings._id;
    }
  },
});
