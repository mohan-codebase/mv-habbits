import { SupabaseClient } from '@supabase/supabase-js';

const IMPORT_TABLES = [
  'profiles',
  'categories',
  'habits',
  'habit_entries',
  'achievements',
  'daily_moods',
  'todos',
  'expenses',
  'goals',
  'trips'
];

export async function importUserData(supabase: SupabaseClient, userId: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        for (const table of IMPORT_TABLES) {
          if (data[table] && Array.isArray(data[table])) {
            const records = data[table].map((row: any) => {
              if (table === 'profiles') {
                return { ...row, id: userId };
              }
              return { ...row, user_id: userId };
            });

            if (records.length === 0) continue;

            // Upsert in chunks to avoid payload too large issues
            const chunkSize = 100;
            for (let i = 0; i < records.length; i += chunkSize) {
              const chunk = records.slice(i, i + chunkSize);
              const { error } = await supabase
                .from(table)
                .upsert(chunk);
              
              if (error) {
                console.error(`Error importing ${table}:`, error);
                throw new Error(`Failed to import ${table}: ${error.message}`);
              }
            }
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
