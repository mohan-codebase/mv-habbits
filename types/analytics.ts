export interface DailyTrend {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
  percentage: number;
}

export interface OverviewStats {
  todayCompleted: number;
  todayTotal: number;
  todayPercentage: number;
  bestStreak: number;
  bestStreakHabitName: string;
  weekPercentage: number;
  totalCompletions: number;
}

