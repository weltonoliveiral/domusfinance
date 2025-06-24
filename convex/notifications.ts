import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { 
  getBrasiliaDate, 
  formatBrasiliaDateTime,
  formatBrasiliaDate
} from "./utils/timezone";

export const getUserNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return notifications.map(notification => ({
      ...notification,
      brasiliaCreationTime: formatBrasiliaDateTime(new Date(notification._creationTime)),
      brasiliaDate: formatBrasiliaDate(new Date(notification._creationTime)),
    }));
  },
});

export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadNotifications.length;
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notificação não encontrada");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: getBrasiliaDate().getTime(),
      brasiliaReadTime: formatBrasiliaDateTime(getBrasiliaDate()),
    });
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    const brasiliaTime = getBrasiliaDate();
    const brasiliaTimeString = formatBrasiliaDateTime(brasiliaTime);

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: brasiliaTime.getTime(),
        brasiliaReadTime: brasiliaTimeString,
      });
    }

    return unreadNotifications.length;
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notificação não encontrada");
    }

    await ctx.db.delete(args.notificationId);
  },
});

export const createCustomNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Usuário não autenticado");

    const brasiliaTime = getBrasiliaDate();

    const notificationId = await ctx.db.insert("notifications", {
      userId,
      type: args.type || "custom",
      title: args.title,
      message: args.message,
      priority: args.priority || "medium",
      isRead: false,
      brasiliaCreationTime: formatBrasiliaDateTime(brasiliaTime),
    });

    return notificationId;
  },
});

// Clean up old notifications (older than 90 days) - runs daily at 2 AM Brasília time
export const cleanupOldNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const brasiliaTime = getBrasiliaDate();
    
    // Only run at 2 AM Brasília time
    if (brasiliaTime.getHours() !== 2) {
      return;
    }

    const ninetyDaysAgo = brasiliaTime.getTime() - (90 * 24 * 60 * 60 * 1000);

    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.lt(q.field("_creationTime"), ninetyDaysAgo))
      .collect();

    let deletedCount = 0;
    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
      deletedCount++;
    }

    return deletedCount;
  },
});
