import { format, isToday, isYesterday, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';

export function formatDate(date: Date | string, fmt = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

/** Local-calendar YYYY-MM-DD for a given Date (defaults to now). */
export function toLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Today in the user's local timezone as YYYY-MM-DD. */
export function todayString(): string {
  return toLocalDateString();
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  return name ? `${greeting}, ${name}` : greeting;
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

export function getWeekDays(startDay = 1): Date[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: startDay as 0 | 1 });
  const end = endOfWeek(today, { weekStartsOn: startDay as 0 | 1 });
  return eachDayOfInterval({ start, end });
}

export function getLast7Days(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
}

export function isHabitDueToday(frequency: { type: string; days?: number[]; count?: number }): boolean {
  if (frequency.type === 'daily') return true;
  if (frequency.type === 'weekly' && frequency.days) {
    const todayDay = new Date().getDay();
    return frequency.days.includes(todayDay);
  }
  if (frequency.type === 'x_per_week' || frequency.type === 'x_per_month') return true;
  return false;
}

export function getFrequencyLabel(frequency: { type: string; days?: number[]; count?: number }): string {
  if (frequency.type === 'daily') return 'Daily';
  if (frequency.type === 'weekly' && frequency.days) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return frequency.days.map(d => dayNames[d]).join(', ');
  }
  if (frequency.type === 'x_per_week') return `${frequency.count}x per week`;
  if (frequency.type === 'x_per_month') return `${frequency.count}x per month`;
  return '';
}

/** Returns YYYY-MM-DD for a habit's created_at string */
export function getHabitCreatedDate(createdAt?: string): string {
  if (!createdAt) return '1970-01-01';
  try {
    const d = parseISO(createdAt);
    if (isNaN(d.getTime())) return createdAt.slice(0, 10);
    return format(d, 'yyyy-MM-dd');
  } catch {
    return createdAt.slice(0, 10);
  }
}

/** Returns true if habit was created on or before targetDate (YYYY-MM-DD) */
export function isHabitActiveOnDate(createdAt?: string, targetDate?: string): boolean {
  if (!targetDate) return true;
  const createdDate = getHabitCreatedDate(createdAt);
  return createdDate <= targetDate;
}

