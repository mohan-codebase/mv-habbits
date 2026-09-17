import { SupabaseClient } from '@supabase/supabase-js';

// 'trips' and 'expenses' were removed here in migration 030 along with the
// tables themselves. 'trips' never matched a real table anyway — the trip
// planner's table was trip_trips — so exporting it only ever logged a warning.
const EXPORT_TABLES = [
  'categories',
  'habits',
  'habit_entries',
  'achievements',
  'daily_moods',
  'todos',
  'goals'
];

export async function exportUserData(supabase: SupabaseClient, userId: string) {
  const exportData: Record<string, any[]> = {};
  
  for (const table of EXPORT_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);
      
    if (!error && data) {
      exportData[table] = data;
    } else {
      console.warn(`Could not export table ${table}:`, error);
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);
    
  if (!profileError && profileData) {
    exportData['profiles'] = profileData;
  }

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = `mv_habits_backup_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
