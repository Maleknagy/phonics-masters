import { db } from '../supabaseClient'; 

export const saveProgress = async (unitNumber, gameType, score, progressPercent) => {
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    // 1. TRANSLATION: Find the real DB ID using the Unit Number
    const { data: unit } = await db
      .from('units')
      .select('id')
      .eq('unit_number', parseInt(unitNumber))
      .single();

    if (!unit) return; // Stop if unit isn't found to avoid errors

    // 2. SAVE: Captured progress is now linked to the correct row
    await db.from('user_progress').upsert({
      user_id: user.id,
      unit_id: unit.id, 
      game_type: gameType,
      score: Math.round(score),
      progress_percent: Math.round(progressPercent),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, unit_id, game_type' });

  } catch (err) {
    console.error("Progress Sync Error:", err);
  }
};