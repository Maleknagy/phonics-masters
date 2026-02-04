import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibXN3a2x0aXFlcHdjeW53Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzAzNzgsImV4cCI6MjA4MzMwNjM3OH0.fVB4f7KIoDdznFgnQ9ZDjr7W4fxk2dJpmu_fStPZ6_s';

export const db = createClient(supabaseUrl, supabaseKey);

// --- ADDED THIS LINE AS A FAILSAFE ---
// This allows other files to use either 'db' or 'supabase'
export const supabase = db; 

/**
 * Global helper to save game progress correctly.
 */
export const saveGameProgress = async (unitNumber, gamePath, percentage) => {
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { data: unit } = await db
      .from('units')
      .select('id')
      .eq('unit_number', unitNumber)
      .single();

    if (!unit) {
      console.error(`Unit number ${unitNumber} not found in database.`);
      return;
    }

    const { error } = await db
      .from('user_progress')
      .upsert({
        user_id: user.id,
        unit_id: unit.id,
        game_type: gamePath,
        progress_percent: percentage,
        last_played: new Date()
      }, { onConflict: 'user_id, unit_id, game_type' });

    if (error) throw error;
    console.log(`Progress saved: ${percentage}% for ${gamePath} in Unit ${unitNumber}`);
    
  } catch (err) {
    console.error("Error saving progress:", err.message);
  }
};