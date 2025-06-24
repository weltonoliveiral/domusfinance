import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getHouseholdMembers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createHouseholdMember = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    monthlyBudget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    return await ctx.db.insert("householdMembers", {
      name: args.name,
      email: args.email,
      userId,
      role: args.role || "member",
      // monthlyBudget: args.monthlyBudget, // Removed for now
    });
  },
});

export const updateHouseholdMember = mutation({
  args: {
    memberId: v.id("householdMembers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    monthlyBudget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const member = await ctx.db.get(args.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Membro não encontrado");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.role !== undefined) updates.role = args.role;
    if (args.monthlyBudget !== undefined) updates.monthlyBudget = args.monthlyBudget;

    await ctx.db.patch(args.memberId, updates);
  },
});

export const deleteHouseholdMember = mutation({
  args: {
    memberId: v.id("householdMembers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const member = await ctx.db.get(args.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Membro não encontrado");
    }

    await ctx.db.delete(args.memberId);
  },
});

// Obter gastos por pessoa responsável no mês
export const getExpensesByPerson = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Buscar todas as despesas do mês
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), `${args.month}-01`) && q.lt(q.field("date"), `${args.month}-32`))
      .collect();

    // Buscar membros da casa
    const members = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Agrupar gastos por pessoa
    const expensesByPerson = new Map();
    
    // Inicializar com todos os membros
    members.forEach(member => {
      expensesByPerson.set(member._id, {
        person: member,
        totalExpenses: 0,
        expenseCount: 0,
        expenses: [],
        budgetLimit: 0, // Remove monthlyBudget reference
      });
    });

    // Adicionar categoria "Sem pessoa específica"
    expensesByPerson.set("no-person", {
      person: { _id: "no-person", name: "Sem pessoa específica", userId },
      totalExpenses: 0,
      expenseCount: 0,
      expenses: [],
      budgetLimit: 0,
    });

    // Processar despesas
    for (const expense of expenses) {
      const category = await ctx.db.get(expense.categoryId);
      const expenseWithCategory = { ...expense, category };
      
      const personKey = expense.householdMemberId || "no-person";
      
      if (expensesByPerson.has(personKey)) {
        const personData = expensesByPerson.get(personKey);
        personData.totalExpenses += expense.amount;
        personData.expenseCount += 1;
        personData.expenses.push(expenseWithCategory);
      }
    }

    // Converter Map para Array e calcular percentuais
    const result = Array.from(expensesByPerson.values()).map(personData => {
      const budgetPercentage = personData.budgetLimit > 0 
        ? (personData.totalExpenses / personData.budgetLimit) * 100 
        : 0;
      
      return {
        ...personData,
        budgetPercentage,
        budgetStatus: budgetPercentage > 100 ? 'exceeded' : 
                     budgetPercentage > 80 ? 'warning' : 
                     budgetPercentage > 60 ? 'caution' : 'good',
      };
    });

    return result.filter(person => person.expenseCount > 0 || person.budgetLimit > 0);
  },
});
