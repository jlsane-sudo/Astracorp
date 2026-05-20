import { supabase } from "../lib/supabase";

export async function loadGame(userId) {
  const { data, error } = await supabase
    .from("game_saves")
    .select("save_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.save_data || null;
}

export async function saveGame(userId, saveData) {
  const { error } = await supabase
    .from("game_saves")
    .upsert({
      user_id: userId,
      save_data: saveData,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}