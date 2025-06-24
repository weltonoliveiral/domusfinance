import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { 
  getBrasiliaDate, 
  getBrasiliaDateString, 
  getBrasiliaMonthString,
  getBrasiliaMonthRange,
  formatBrasiliaDateTime,
  isBusinessHoursBrasilia,
  getNextBusinessDayBrasilia
} from "./utils/timezone";

export const triggerBudgetCheck = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentMonth = getBrasiliaMonthString();
    
    // Get user's budgets for current month
    const budgets = await ctx.runQuery(internal.budgetMonitoring.getUserBudgets, {
      userId: args.userId,
      month: currentMonth,
    });

    for (const budget of budgets) {
      const { start, end } = getBrasiliaMonthRange(currentMonth);
      
      // Calculate spent amount for this category in current month
      const spent = await ctx.runQuery(internal.budgetMonitoring.getCategorySpent, {
        userId: args.userId,
        categoryId: budget.categoryId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });

      const percentage = (spent / budget.limit) * 100;
      let status: "good" | "caution" | "warning" | "exceeded" = "good";
      
      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 90) {
        status = "warning";
      } else if (percentage >= 75) {
        status = "caution";
      }

      // Update budget status
      await ctx.runMutation(internal.budgetMonitoring.updateBudgetStatus, {
        budgetId: budget._id,
        spent,
        percentage,
        status,
        lastChecked: getBrasiliaDate().getTime(),
      });

      // Send notifications based on status and business hours
      if (status !== "good" && isBusinessHoursBrasilia()) {
        await ctx.runMutation(internal.budgetMonitoring.createBudgetNotification, {
          userId: args.userId,
          budgetId: budget._id,
          categoryName: budget.category?.name || "Categoria",
          status,
          spent,
          limit: budget.limit,
          percentage,
        });
      }
    }
  },
});

export const getUserBudgets = internalQuery({
  args: { 
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => 
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .collect();

    const budgetsWithCategories = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        return { ...budget, category };
      })
    );

    return budgetsWithCategories;
  },
});

export const getCategorySpent = internalQuery({
  args: {
    userId: v.id("users"),
    categoryId: v.id("categories"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .collect();

    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  },
});

export const updateBudgetStatus = internalMutation({
  args: {
    budgetId: v.id("budgets"),
    spent: v.number(),
    percentage: v.number(),
    status: v.union(
      v.literal("good"),
      v.literal("caution"), 
      v.literal("warning"),
      v.literal("exceeded")
    ),
    lastChecked: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.budgetId, {
      spent: args.spent,
      percentage: args.percentage,
      status: args.status,
      lastChecked: args.lastChecked,
      lastCheckedBrasilia: formatBrasiliaDateTime(new Date(args.lastChecked)),
    });
  },
});

export const createBudgetNotification = internalMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("budgets"),
    categoryName: v.string(),
    status: v.union(
      v.literal("caution"), 
      v.literal("warning"),
      v.literal("exceeded")
    ),
    spent: v.number(),
    limit: v.number(),
    percentage: v.number(),
  },
  handler: async (ctx, args) => {
    const brasiliaTime = getBrasiliaDate();
    
    let title = "";
    let message = "";
    let priority: "low" | "medium" | "high" = "medium";

    switch (args.status) {
      case "caution":
        title = `⚠️ Atenção: Orçamento de ${args.categoryName}`;
        message = `Você já gastou ${args.percentage.toFixed(1)}% do orçamento desta categoria.`;
        priority = "low";
        break;
      case "warning":
        title = `🚨 Alerta: Orçamento de ${args.categoryName}`;
        message = `Cuidado! Você já gastou ${args.percentage.toFixed(1)}% do orçamento desta categoria.`;
        priority = "medium";
        break;
      case "exceeded":
        title = `🔴 Orçamento Excedido: ${args.categoryName}`;
        message = `Você excedeu o orçamento desta categoria em ${(args.percentage - 100).toFixed(1)}%.`;
        priority = "high";
        break;
    }

    // Check if similar notification was sent recently (within 24 hours)
    const recentNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "budget_alert"),
          q.eq(q.field("relatedId"), args.budgetId),
          q.gt(q.field("_creationTime"), brasiliaTime.getTime() - 24 * 60 * 60 * 1000)
        )
      )
      .collect();

    // Only create notification if no recent similar notification exists
    if (recentNotifications.length === 0) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "budget_alert",
        title,
        message: `${message} Gasto atual: R$ ${args.spent.toFixed(2)} de R$ ${args.limit.toFixed(2)}`,
        priority,
        relatedId: args.budgetId,
        isRead: false,
        brasiliaCreationTime: formatBrasiliaDateTime(brasiliaTime),
      });
    }
  },
});

// Scheduled function to run daily budget checks at 9 AM Brasília time
export const dailyBudgetCheck = internalAction({
  args: {},
  handler: async (ctx) => {
    const brasiliaTime = getBrasiliaDate();
    
    // Only run during business hours (9 AM Brasília time)
    if (brasiliaTime.getHours() !== 9) {
      return;
    }

    // Get all users who have budgets for current month
    const currentMonth = getBrasiliaMonthString();
    const budgets = await ctx.runQuery(internal.budgetMonitoring.getAllActiveBudgets, {
      month: currentMonth,
    });

    // Group budgets by user
    const userBudgets = new Map();
    budgets.forEach((budget: any) => {
      if (!userBudgets.has(budget.userId)) {
        userBudgets.set(budget.userId, []);
      }
      userBudgets.get(budget.userId).push(budget);
    });

    // Trigger budget check for each user
    for (const [userId] of userBudgets) {
      await ctx.runAction(internal.budgetMonitoring.triggerBudgetCheck, {
        userId: userId as any,
      });
    }
  },
});

export const getAllActiveBudgets = internalQuery({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgets")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();
  },
});

// Monthly report generation at the end of each month (last day at 6 PM Brasília time)
export const generateMonthlyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const brasiliaTime = getBrasiliaDate();
    
    // Check if it's the last day of the month at 6 PM Brasília time
    const tomorrow = new Date(brasiliaTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isLastDayOfMonth = tomorrow.getDate() === 1;
    const isCorrectHour = brasiliaTime.getHours() === 18;
    
    if (!isLastDayOfMonth || !isCorrectHour) {
      return;
    }

    const currentMonth = getBrasiliaMonthString();
    
    // Get all users who had expenses this month
    const users = await ctx.runQuery(internal.budgetMonitoring.getUsersWithExpensesThisMonth, {
      month: currentMonth,
    });

    for (const userId of users) {
      await ctx.runMutation(internal.budgetMonitoring.createMonthlyReportNotification, {
        userId,
        month: currentMonth,
      });
    }
  },
});

export const getUsersWithExpensesThisMonth = internalQuery({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const { start, end } = getBrasiliaMonthRange(args.month);
    
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => 
        q.gte("date", start.toISOString().split('T')[0])
         .lte("date", end.toISOString().split('T')[0])
      )
      .collect();

    const userIds = new Set(expenses.map(expense => expense.userId));
    return Array.from(userIds);
  },
});

export const createMonthlyReportNotification = internalMutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const brasiliaTime = getBrasiliaDate();
    const [year, month] = args.month.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "monthly_report",
      title: `📊 Relatório Mensal - ${monthName}`,
      message: `Seu relatório mensal de despesas está disponível. Acesse a seção de Relatórios para visualizar suas estatísticas e análises detalhadas.`,
      priority: "medium" as const,
      relatedId: args.month,
      isRead: false,
      brasiliaCreationTime: formatBrasiliaDateTime(brasiliaTime),
    });
  },
});
