import { createServerClient } from '@/lib/supabase/server';
import { buildCoachSummary, bestWeekday } from '@/lib/coach/aggregate';
import PrintButton from '@/components/dashboard/PrintButton';

export const metadata = { title: 'Year in Review · Productivity Master' };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', border: '1px solid #e3e3e3', borderRadius: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#555555' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Printable, light-themed (so the PDF is clean regardless of app theme).
export default async function YearInReviewPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div style={{ padding: 40 }}>Please sign in.</div>;

  const summary = await buildCoachSummary(supabase, user.id, 365);

  const partOfDayTop = summary
    ? (Object.entries(summary.partOfDay).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0])
    : ['—', 0];

  return (
    <div style={{ background: '#fff', color: '#191919', minHeight: '100vh', padding: '32px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 16mm; } body { background: #fff; } }`}</style>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>Year in Review</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888888' }}>
              {summary ? `${summary.from} → ${summary.to}` : 'Productivity Master'}
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a
              href="/api/export?format=year-csv"
              style={{
                padding: '10px 16px', borderRadius: 12, textDecoration: 'none',
                border: '1px solid #e3e3e3', background: '#fff', color: '#555555',
                fontSize: 14, fontWeight: 700,
              }}
            >
              Download CSV
            </a>
            <PrintButton />
          </div>
        </div>

        {!summary || summary.totalCompletions === 0 ? (
          <p style={{ fontSize: 15, color: '#888888', padding: '40px 0', textAlign: 'center' }}>
            No habit history to summarize yet. Come back after you&apos;ve logged some habits.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <Stat label="Completions" value={summary.totalCompletions.toLocaleString()} />
              <Stat label="Active days" value={summary.activeDays} />
              <Stat label="Completion" value={`${summary.overallCompletionRate}%`} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <Stat label="Strongest day" value={bestWeekday(summary.weekday) ?? '—'} />
              <Stat label="Best time" value={String(partOfDayTop[0]).replace(/^\w/, (c) => c.toUpperCase())} />
              <Stat label="Habits tracked" value={summary.totalHabits} />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>By habit</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#888888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '8px 6px' }}>Habit</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Done</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Best streak</th>
                </tr>
              </thead>
              <tbody>
                {[...summary.habits].sort((a, b) => b.completions - a.completions).map((h, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #ececec' }}>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>
                      {h.name} {h.isBad && <span style={{ color: '#888888', fontWeight: 400 }}>(avoid)</span>}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{h.completions}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{h.completionRate}%</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{h.longestStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ marginTop: 28, fontSize: 11, color: '#adadad', textAlign: 'center' }}>
              Generated by Productivity Master · Use “Save as PDF” or your browser’s print dialog.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
