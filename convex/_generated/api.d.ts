/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as budgetMonitoring from "../budgetMonitoring.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as expenses from "../expenses.js";
import type * as householdMembers from "../householdMembers.js";
import type * as householdSharing from "../householdSharing.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as passwordReset from "../passwordReset.js";
import type * as router from "../router.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as shoppingLists from "../shoppingLists.js";
import type * as userInitialization from "../userInitialization.js";
import type * as userProfile from "../userProfile.js";
import type * as userSettings from "../userSettings.js";
import type * as utils_timezone from "../utils/timezone.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  budgetMonitoring: typeof budgetMonitoring;
  budgets: typeof budgets;
  categories: typeof categories;
  crons: typeof crons;
  expenses: typeof expenses;
  householdMembers: typeof householdMembers;
  householdSharing: typeof householdSharing;
  http: typeof http;
  notifications: typeof notifications;
  passwordReset: typeof passwordReset;
  router: typeof router;
  savingsGoals: typeof savingsGoals;
  shoppingLists: typeof shoppingLists;
  userInitialization: typeof userInitialization;
  userProfile: typeof userProfile;
  userSettings: typeof userSettings;
  "utils/timezone": typeof utils_timezone;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
