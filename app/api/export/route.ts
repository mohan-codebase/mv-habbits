import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils/dates';
import { buildCoachSummary } from '@/lib/coach/aggregate';
import { safeErrorMessage } from '@/lib/utils/api';

// CSV formula-injection guard: spreadsheets execute cells starting with
// = + - @ \t \r as formulas. Prefixing with a leading single quote disables
// formula evaluation while preserving the displayed text.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // Always quote and escape embedded quotes/newlines/commas.
  s = s.replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format') || 'json';

    // Year-in-review: one clean summary row per habit (aggregated, not raw entries).
    if (format === 'year-csv') {
      const days = Number(req.nextUrl.searchParams.get('days')) || 365;
      const summary = await buildCoachSummary(supabase, user.id, days);
      if (!summary || summary.habits.length === 0) {
        return new NextResponse('No data to summarize yet', { status: 404 });
      }
      const header = ['habit', 'type', 'completions', 'tracked_days', 'completion_rate_pct', 'current_streak', 'longest_streak']
        .map(csvCell).join(',');
      const rows = summary.habits.map((h) => [
        csvCell(h.name), csvCell(h.isBad ? 'avoid' : 'build'), csvCell(h.completions),
        csvCell(h.trackedDays), csvCell(h.completionRate), csvCell(h.currentStreak), csvCell(h.longestStreak),
      ].join(','));
      const totals = [
        csvCell('ALL HABITS'), csvCell(`${summary.from}→${summary.to}`), csvCell(summary.totalCompletions),
        csvCell(''), csvCell(summary.overallCompletionRate), csvCell(''), csvCell(''),
      ].join(',');
      const csvData = '﻿' + [header, ...rows, totals].join('\r\n');
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="productivity-master-year-in-review-${todayString()}.csv"`,
        },
      });
    }

    if (format === 'csv') {
      const { data: entries } = await supabase
        .from('habit_entries')
        .select('*, habit:habits(name)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (!entries || entries.length === 0) {
        return new NextResponse('No entries to export yet', { status: 404 });
      }

      const header = ['habit_name', 'entry_date', 'is_completed', 'value', 'notes']
        .map(csvCell)
        .join(',');

      const body = entries.map((e) => {
        const habitName = (e.habit as { name: string } | null)?.name ?? '';
        return [
          csvCell(habitName),
          csvCell(e.entry_date),
          csvCell(e.is_completed),
          csvCell(e.value ?? ''),
          csvCell(e.notes ?? ''),
        ].join(',');
      });

      // CRLF line endings + UTF-8 BOM for maximum spreadsheet compatibility.
      const csvData = '﻿' + [header, ...body].join('\r\n');
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="productivity-master-entries-${todayString()}.csv"`,
        },
      });
    }

    // Default JSON
    const [habitsRes, entriesRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('habit_entries').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      habits: habitsRes.data ?? [],
      entries: entriesRes.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="productivity-master-export-${todayString()}.json"`,
      },
    });

  } catch (e) {
    return new NextResponse(safeErrorMessage(e, 'Failed to export data'), { status: 500 });
  }
}
