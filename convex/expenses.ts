import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { 
  getBrasiliaDate, 
  getBrasiliaDateString, 
  getBrasiliaMonthRange,
  formatBrasiliaDate,
  formatBrasiliaDateTime,
  toBrasiliaDate
} from "./utils/timezone";

export const getExpenses = query({
  args: { 
    month: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    householdMemberId: v.optional(v.id("householdMembers")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db.query("expenses").withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.month) {
      const { start, end } = getBrasiliaMonthRange(args.month);
      
      query = ctx.db.query("expenses").withIndex("by_user_date", (q) => 
        q.eq("userId", userId)
         .gte("date", start.toISOString().split('T')[0])
         .lte("date", end.toISOString().split('T')[0])
      );
    }

    let expenses = await query.order("desc").collect();

    if (args.categoryId) {
      expenses = expenses.filter(expense => expense.categoryId === args.categoryId);
    }

    if (args.householdMemberId) {
      expenses = expenses.filter(expense => expense.householdMemberId === args.householdMemberId);
    }

    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.categoryId);
        const householdMember = expense.householdMemberId 
          ? await ctx.db.get(expense.householdMemberId)
          : null;

        return {
          ...expense,
          category,
          householdMember,
          // Add Brasília timezone formatted dates
          brasiliaDate: formatBrasiliaDate(expense.date),
          brasiliaDateTime: formatBrasiliaDateTime(new Date(expense._creationTime)),
        };
      })
    );

    return expensesWithDetails;
  },
});

export const getRecentExpenses = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit);

    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.categoryId);
        const householdMember = expense.householdMemberId 
          ? await ctx.db.get(expense.householdMemberId)
          : null;

        return {
          ...expense,
          category,
          householdMember,
          brasiliaDate: formatBrasiliaDate(expense.date),
          brasiliaDateTime: formatBrasiliaDateTime(new Date(expense._creationTime)),
        };
      })
    );

    return expensesWithDetails;
  },
});

export const getMonthlyExpensesSummary = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const { start, end } = getBrasiliaMonthRange(args.month);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId)
         .gte("date", start.toISOString().split('T')[0])
         .lte("date", end.toISOString().split('T')[0])
      )
      .collect();

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    const daysInMonth = end.getDate();
    const dailyAverage = totalExpenses / daysInMonth;

    // Group by category
    const categoryMap = new Map();
    
    for (const expense of expenses) {
      const category = await ctx.db.get(expense.categoryId);
      if (category) {
        const existing = categoryMap.get(expense.categoryId) || { category, total: 0, count: 0 };
        existing.total += expense.amount;
        existing.count += 1;
        categoryMap.set(expense.categoryId, existing);
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total);

    return {
      totalExpenses,
      expenseCount,
      dailyAverage,
      categoryBreakdown,
      monthRange: {
        start: formatBrasiliaDate(start),
        end: formatBrasiliaDate(end)
      }
    };
  },
});

export const getExpenseChartData = query({
  args: { 
    period: v.union(v.literal("days"), v.literal("weeks"), v.literal("months"), v.literal("year")),
    timeRange: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = getBrasiliaDate();
    let startDate: Date;

    switch (args.period) {
      case "days":
        startDate = new Date(now.getTime() - args.timeRange * 24 * 60 * 60 * 1000);
        break;
      case "weeks":
        startDate = new Date(now.getTime() - args.timeRange * 7 * 24 * 60 * 60 * 1000);
        break;
      case "months":
        startDate = new Date(now.getFullYear(), now.getMonth() - args.timeRange, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear() - args.timeRange, 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Convert to Brasília timezone
    startDate = toBrasiliaDate(startDate);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId)
         .gte("date", startDate.toISOString().split('T')[0])
      )
      .collect();

    // Group expenses by their respective time periods
    const groupedData = new Map();
    
    // First, add all expenses to their respective groups
    for (const expense of expenses) {
      const expenseDate = new Date(expense.date + 'T00:00:00');
      let key: string;
      let label: string;

      switch (args.period) {
        case "days":
          key = expense.date;
          label = formatBrasiliaDate(expenseDate, { day: '2-digit', month: '2-digit' });
          break;
        case "weeks":
          const weekStart = new Date(expenseDate);
          weekStart.setDate(expenseDate.getDate() - expenseDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          label = formatBrasiliaDate(weekStart, { day: '2-digit', month: '2-digit' });
          break;
        case "months":
          key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
          label = formatBrasiliaDate(expenseDate, { month: 'short', year: 'numeric' });
          break;
        case "year":
          key = expenseDate.getFullYear().toString();
          label = expenseDate.getFullYear().toString();
          break;
        default:
          key = expense.date;
          label = formatBrasiliaDate(expenseDate);
      }

      const existing = groupedData.get(key) || { label, amount: 0 };
      existing.amount += expense.amount;
      groupedData.set(key, existing);
    }

    // Create a complete timeline with all intervals, including zero values
    const completeTimeline = new Map();
    
    // Generate all intervals in the range
    const currentDate = new Date(startDate);
    const endDate = new Date(now);

    while (currentDate <= endDate) {
      let key: string;
      let label: string;
      let nextDate: Date;

      switch (args.period) {
        case "days":
          key = currentDate.toISOString().split('T')[0];
          label = formatBrasiliaDate(currentDate, { day: '2-digit', month: '2-digit' });
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 1);
          break;
        case "weeks":
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - currentDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          label = formatBrasiliaDate(weekStart, { day: '2-digit', month: '2-digit' });
          nextDate = new Date(weekStart);
          nextDate.setDate(weekStart.getDate() + 7);
          break;
        case "months":
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          label = formatBrasiliaDate(currentDate, { month: 'short', year: 'numeric' });
          nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          break;
        case "year":
          key = currentDate.getFullYear().toString();
          label = currentDate.getFullYear().toString();
          nextDate = new Date(currentDate.getFullYear() + 1, 0, 1);
          break;
        default:
          key = currentDate.toISOString().split('T')[0];
          label = formatBrasiliaDate(currentDate);
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 1);
      }

      // Use existing data if available, otherwise set to 0
      const existingData = groupedData.get(key);
      completeTimeline.set(key, {
        label,
        amount: existingData ? existingData.amount : 0
      });

      currentDate.setTime(nextDate.getTime());
    }

    // Convert to array and sort chronologically
    const sortedEntries = Array.from(completeTimeline.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sortedEntries.map(([_, value]) => value);
  },
});

export const createExpense = mutation({
  args: {
    description: v.optional(v.string()),
    amount: v.number(),
    date: v.optional(v.string()), // Make date optional to use current Brasília date
    categoryId: v.id("categories"),
    householdMemberId: v.optional(v.id("householdMembers")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    // Use current Brasília date if not provided
    const expenseDate = args.date || getBrasiliaDateString();

    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      date: expenseDate,
      userId,
      // Store creation time in Brasília timezone
      brasiliaCreationTime: getBrasiliaDate().getTime(),
    });

    // Trigger budget check after creating expense
    await ctx.scheduler.runAfter(0, internal.budgetMonitoring.triggerBudgetCheck, {
      userId,
    });

    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.number(),
    date: v.string(),
    categoryId: v.id("categories"),
    householdMemberId: v.optional(v.id("householdMembers")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Despesa não encontrada");
    }

    await ctx.db.patch(args.expenseId, {
      description: args.description,
      amount: args.amount,
      date: args.date,
      categoryId: args.categoryId,
      householdMemberId: args.householdMemberId,
      notes: args.notes,
      // Update modification time in Brasília timezone
      brasiliaModificationTime: getBrasiliaDate().getTime(),
    });

    // Trigger budget check after updating expense
    await ctx.scheduler.runAfter(0, internal.budgetMonitoring.triggerBudgetCheck, {
      userId,
    });

    return args.expenseId;
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Despesa não encontrada");
    }

    await ctx.db.delete(args.expenseId);

    // Trigger budget check after deleting expense
    await ctx.scheduler.runAfter(0, internal.budgetMonitoring.triggerBudgetCheck, {
      userId,
    });

    return args.expenseId;
  },
});
