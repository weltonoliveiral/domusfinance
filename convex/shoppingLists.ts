// Temporarily disabled - shoppingLists functionality
// This file is temporarily disabled to focus on core timezone functionality

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Placeholder functions to maintain API compatibility
export const getShoppingListByMonth = query({
  args: {
    monthYear: v.string(), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    return null;
  },
});

export const createShoppingList = mutation({
  args: {
    name: v.string(),
    monthYear: v.string(),
    totalBudget: v.number(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const getShoppingItems = query({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    return [];
  },
});

export const addShoppingItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    name: v.string(),
    category: v.string(),
    estimatedPrice: v.number(),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const toggleItemPurchased = mutation({
  args: {
    itemId: v.id("shoppingItems"),
    isPurchased: v.boolean(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const updateItemPrice = mutation({
  args: {
    itemId: v.id("shoppingItems"),
    actualPrice: v.number(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const deleteShoppingItem = mutation({
  args: {
    itemId: v.id("shoppingItems"),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const updateShoppingListStatus = mutation({
  args: {
    listId: v.id("shoppingLists"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const getShoppingListSummary = query({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    return null;
  },
});
