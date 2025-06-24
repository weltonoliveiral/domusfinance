// Temporarily disabled - householdSharing functionality
// This file is temporarily disabled to focus on core timezone functionality

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Placeholder functions to maintain API compatibility
export const inviteUserToHousehold = mutation({
  args: {
    email: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const acceptHouseholdInvite = mutation({
  args: {
    inviteId: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const rejectHouseholdInvite = mutation({
  args: {
    inviteId: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Funcionalidade temporariamente desabilitada");
  },
});

export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

export const getSharedHouseholds = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

export const getSharedExpenses = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return [];
  },
});
