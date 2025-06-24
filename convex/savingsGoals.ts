import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserSavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return goals.map(goal => {
      const progress = goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0;
      const remaining = goal.targetAmount - (goal.currentAmount || 0);
      
      // Calcular dias restantes
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        progress,
        remaining,
        daysRemaining,
        status: progress >= 100 ? 'completed' : daysRemaining < 0 ? 'overdue' : daysRemaining <= 30 ? 'urgent' : 'on_track'
      };
    });
  },
});

export const createSavingsGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    return await ctx.db.insert("savingsGoals", {
      ...args,
      currentAmount: 0,
      userId,
    });
  },
});

export const updateSavingsGoalProgress = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Meta não encontrada ou sem permissão");
    }

    const newAmount = Math.max(0, (goal.currentAmount || 0) + args.amount);
    await ctx.db.patch(args.goalId, { currentAmount: newAmount });
  },
});

export const deleteSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Meta não encontrada ou sem permissão");
    }

    await ctx.db.delete(args.goalId);
  },
});
