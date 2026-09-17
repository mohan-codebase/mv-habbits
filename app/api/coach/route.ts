import { NextResponse, connection } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { buildCoachSummary, bestWeekday } from '@/lib/coach/aggregate';
import { safeErrorMessage } from '@/lib/utils/api';

interface Insight { title: string; detail: string; tone: 'positive' | 'suggestion' | 'warning' }

function ok<T>(data: T) { return NextResponse.json({ data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ data: null, error: message }, { status }); }

// Monday (UTC) of the current week — the cache key, so insights refresh weekly.
function weekStart(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const SYSTEM_PROMPT = `You are the habit coach inside MV Habits, a premium habit tracker.
You receive a compact JSON summary of one user's recent habit data (never raw entries).
Write 2–4 short, specific, encouraging insights that help them improve.

Rules:
- Ground every insight in the numbers provided; never invent data or habit names.
- Be concrete and actionable ("your Tuesdays are strongest — protect that slot").
- "partOfDay" comes from completion timestamps in UTC, so it is approximate — phrase
  time-of-day observations softly ("you tend to…"), never as hard fact.
- For habits marked isBad, higher "avoided" completion is good; frame accordingly.
- Keep each "detail" to one or two sentences. Warm, direct, no fluff, no emojis.
- "tone" is "positive" for wins, "suggestion" for tips, "warning" for slipping streaks.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    insights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          tone: { type: 'string', enum: ['positive', 'suggestion', 'warning'] },
        },
        required: ['title', 'detail', 'tone'],
      },
    },
  },
  required: ['insights'],
} as const;

export async function GET() {
  // This handler takes no request args, so Next would otherwise attempt to
  // prerender it and only hit the dynamic `cookies()` access deep inside the
  // try/catch (surfacing as a HANGING_PROMISE_REJECTION at build). Signal
  // runtime rendering up front so prerendering defers cleanly to request time.
  await connection();
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const week = weekStart();

    // 1) Serve a cached result for this week if present (degrade gracefully if the
    //    table doesn't exist yet — feature still works, just regenerates each call).
    try {
      const { data: cached } = await supabase
        .from('ai_insights')
        .select('insights, generated_at')
        .eq('user_id', user.id)
        .eq('week_start', week)
        .maybeSingle();
      if (cached?.insights) {
        return ok({ insights: cached.insights, generatedAt: cached.generated_at, cached: true });
      }
    } catch { /* table missing — continue to generate */ }

    if (!process.env.ANTHROPIC_API_KEY) {
      return err('AI coach is not configured. Set ANTHROPIC_API_KEY.', 503);
    }

    // 2) Build the compact summary (bounded + single-pass; see lib/coach/aggregate).
    const summary = await buildCoachSummary(supabase, user.id, 90);
    if (!summary || summary.totalCompletions === 0) {
      return ok({ insights: [], generatedAt: new Date().toISOString(), cached: false, empty: true });
    }

    // 3) One model call. Stable system prompt is marked for caching; the volatile
    //    per-user summary goes in the user turn so the prefix stays reusable.
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content:
          `Strongest weekday so far: ${bestWeekday(summary.weekday) ?? 'n/a'}.\n` +
          `Here is the summary JSON:\n${JSON.stringify(summary)}`,
      }],
    });

    const text = message.content.find((b) => b.type === 'text');
    const parsed = text && 'text' in text ? (JSON.parse(text.text) as { insights: Insight[] }) : { insights: [] };
    const insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : [];
    const generatedAt = new Date().toISOString();

    // 4) Cache for the rest of the week (best-effort).
    try {
      await supabase.from('ai_insights').upsert(
        { user_id: user.id, week_start: week, insights, generated_at: generatedAt },
        { onConflict: 'user_id,week_start' },
      );
    } catch { /* table missing — return uncached */ }

    return ok({ insights, generatedAt, cached: false });
  } catch (e) {
    console.error('[coach] error:', e);
    return err(safeErrorMessage(e, 'Failed to generate insights'), 500);
  }
}
