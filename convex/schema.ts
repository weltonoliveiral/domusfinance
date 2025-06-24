import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    userId: v.id("users"),
    isDefault: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  expenses: defineTable({
    description: v.optional(v.string()),
    amount: v.number(),
    date: v.string(),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    householdMemberId: v.optional(v.id("householdMembers")),
    notes: v.optional(v.string()),
    // Brasília timezone tracking
    brasiliaCreationTime: v.optional(v.number()),
    brasiliaModificationTime: v.optional(v.number()),
    // Legacy fields for backward compatibility
    name: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_date", ["date"])
    .index("by_category", ["categoryId"]),

  budgets: defineTable({
    categoryId: v.id("categories"),
    userId: v.id("users"),
    month: v.optional(v.string()),
    monthYear: v.optional(v.string()), // Support both formats during migration
    limit: v.number(),
    spent: v.optional(v.number()),
    percentage: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("good"),
      v.literal("caution"),
      v.literal("warning"),
      v.literal("exceeded")
    )),
    lastChecked: v.optional(v.number()),
    lastCheckedBrasilia: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_month", ["userId", "month"])
    .index("by_month", ["month"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    isRead: v.optional(v.boolean()),
    relatedId: v.optional(v.string()),
    readAt: v.optional(v.number()),
    brasiliaCreationTime: v.optional(v.string()),
    brasiliaReadTime: v.optional(v.string()),
    // Legacy fields for backward compatibility
    read: v.optional(v.boolean()),
    alertType: v.optional(v.string()),
    budgetId: v.optional(v.string()),
    limit: v.optional(v.number()),
    spent: v.optional(v.number()),
    percentage: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  householdMembers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    role: v.string(),
    userId: v.id("users"),
    avatar: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    joinedAt: v.optional(v.number()),
    brasiliaJoinedAt: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  savingsGoals: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    targetDate: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
    brasiliaCompletedAt: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  shoppingLists: defineTable({
    name: v.string(),
    items: v.optional(v.array(v.object({
      name: v.string(),
      quantity: v.optional(v.number()),
      unit: v.optional(v.string()),
      price: v.optional(v.number()),
      isCompleted: v.boolean(),
      completedAt: v.optional(v.number()),
      brasiliaCompletedAt: v.optional(v.string()),
    }))),
    userId: v.id("users"),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
    brasiliaCompletedAt: v.optional(v.string()),
    // Legacy fields for backward compatibility
    monthYear: v.optional(v.string()),
    status: v.optional(v.string()),
    totalBudget: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    notifications: v.optional(v.object({
      budgetAlerts: v.boolean(),
      monthlyReports: v.boolean(),
      expenseReminders: v.boolean(),
      emailNotifications: v.optional(v.boolean()),
    })),
    theme: v.optional(v.string()),
    // Brasília timezone preferences
    preferBrasiliaTime: v.optional(v.boolean()),
    brasiliaTimeFormat: v.optional(v.string()), // 12h or 24h
  }).index("by_user", ["userId"]),

  passwordResetTokens: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.optional(v.boolean()),
    usedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_expires", ["expiresAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
