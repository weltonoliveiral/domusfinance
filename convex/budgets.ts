import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBudgets = query({
  args: {
    month: v.string(), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => 
        q.eq("userId", userId).eq("month", args.month)
      )
      .collect();

    // Buscar gastos do mês para cada categoria
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        
        const [year, monthNum] = args.month.split('-');
        const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0);
        
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_user_date", (q) => 
            q.eq("userId", userId)
             .gte("date", startOfMonth.toISOString().split('T')[0])
             .lte("date", endOfMonth.toISOString().split('T')[0])
          )
          .filter((q) => q.eq(q.field("categoryId"), budget.categoryId))
          .collect();

        const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

        return {
          ...budget,
          category,
          spent,
          remaining: budget.limit - spent,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : percentage >= 80 ? 'caution' : 'safe'
        };
      })
    );

    return budgetsWithSpent;
  },
});

export const getUserBudgets = query({
  args: {
    month: v.string(), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => 
        q.eq("userId", userId).eq("month", args.month)
      )
      .collect();

    // Buscar gastos do mês para cada categoria
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        
        const [year, monthNum] = args.month.split('-');
        const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0);
        
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_user_date", (q) => 
            q.eq("userId", userId)
             .gte("date", startOfMonth.toISOString().split('T')[0])
             .lte("date", endOfMonth.toISOString().split('T')[0])
          )
          .filter((q) => q.eq(q.field("categoryId"), budget.categoryId))
          .collect();

        const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

        return {
          ...budget,
          category,
          spent,
          remaining: budget.limit - spent,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : percentage >= 80 ? 'caution' : 'safe'
        };
      })
    );

    return budgetsWithSpent;
  },
});

export const createBudget = mutation({
  args: {
    categoryId: v.id("categories"),
    month: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Verificar se já existe um orçamento para esta categoria e mês
    const existingBudget = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => 
        q.eq("userId", userId).eq("month", args.month)
      )
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .first();

    if (existingBudget) {
      await ctx.db.patch(existingBudget._id, { limit: args.limit });
      return existingBudget._id;
    } else {
      return await ctx.db.insert("budgets", {
        categoryId: args.categoryId,
        month: args.month,
        limit: args.limit,
        userId,
      });
    }
  },
});

export const updateBudget = mutation({
  args: {
    budgetId: v.id("budgets"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== userId) {
      throw new Error("Orçamento não encontrado ou sem permissão");
    }

    await ctx.db.patch(args.budgetId, { limit: args.limit });
  },
});

export const createOrUpdateBudget = mutation({
  args: {
    categoryId: v.id("categories"),
    month: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Verificar se já existe um orçamento para esta categoria e mês
    const existingBudget = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => 
        q.eq("userId", userId).eq("month", args.month)
      )
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .first();

    if (existingBudget) {
      await ctx.db.patch(existingBudget._id, { limit: args.limit });
      return existingBudget._id;
    } else {
      return await ctx.db.insert("budgets", {
        categoryId: args.categoryId,
        month: args.month,
        limit: args.limit,
        userId,
      });
    }
  },
});

export const deleteBudget = mutation({
  args: {
    budgetId: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== userId) {
      throw new Error("Orçamento não encontrado ou sem permissão");
    }

    await ctx.db.delete(args.budgetId);
  },
});
