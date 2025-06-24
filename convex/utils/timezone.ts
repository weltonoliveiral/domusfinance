// Utility functions for Brasília timezone handling
export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Get current date and time in Brasília timezone
 */
export function getBrasiliaDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }));
}

/**
 * Get current date string in YYYY-MM-DD format (Brasília timezone)
 */
export function getBrasiliaDateString(): string {
  const date = getBrasiliaDate();
  return date.toISOString().split('T')[0];
}

/**
 * Get current month string in YYYY-MM format (Brasília timezone)
 */
export function getBrasiliaMonthString(): string {
  const date = getBrasiliaDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Convert any date to Brasília timezone
 */
export function toBrasiliaDate(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return new Date(inputDate.toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }));
}

/**
 * Format date for display in Brazilian format
 */
export function formatBrasiliaDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    ...options
  });
}

/**
 * Format datetime for display in Brazilian format
 */
export function formatBrasiliaDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    ...options
  });
}

/**
 * Get start and end of month in Brasília timezone
 */
export function getBrasiliaMonthRange(monthString: string): { start: Date; end: Date } {
  const [year, month] = monthString.split('-');
  
  // Create dates in Brasília timezone
  const start = new Date();
  start.setFullYear(parseInt(year), parseInt(month) - 1, 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setFullYear(parseInt(year), parseInt(month), 0);
  end.setHours(23, 59, 59, 999);
  
  // Convert to Brasília timezone
  return {
    start: toBrasiliaDate(start),
    end: toBrasiliaDate(end)
  };
}

/**
 * Get current hour in Brasília timezone
 */
export function getBrasiliaHour(): number {
  return getBrasiliaDate().getHours();
}

/**
 * Check if current time is within business hours in Brasília (8 AM - 6 PM)
 */
export function isBusinessHoursBrasilia(): boolean {
  const hour = getBrasiliaHour();
  return hour >= 8 && hour < 18;
}

/**
 * Get next business day in Brasília timezone
 */
export function getNextBusinessDayBrasilia(): Date {
  const date = getBrasiliaDate();
  date.setDate(date.getDate() + 1);
  
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}
