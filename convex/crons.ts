import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily budget monitoring at 9 AM Brasília time (12 PM UTC)
crons.cron("daily budget check", "0 12 * * *", internal.budgetMonitoring.dailyBudgetCheck, {});

// Monthly report generation on last day of month at 6 PM Brasília time (9 PM UTC)
crons.cron("monthly reports", "0 21 28-31 * *", internal.budgetMonitoring.generateMonthlyReports, {});

// Cleanup expired password reset tokens every 6 hours
crons.cron("cleanup expired tokens", "0 */6 * * *", internal.passwordReset.cleanupExpiredTokens, {});

export default crons;
