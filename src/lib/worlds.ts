import { supabase } from "./supabase";

export async function createWorld(
  ownerId: string
) {
  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const { data, error } =
    await supabase
      .from("worlds")
      .insert({
        code,
        owner_id: ownerId,
      })
      .select()
      .single();

  if (error) throw error;

  await supabase
    .from("world_members")
    .insert({
      world_id: data.id,
      player_id: ownerId,
      role: "owner",
    });

  return data;
}

export async function joinWorld(
    code: string,
    playerId: string
  ) {
    const { data: world } =
      await supabase
        .from("worlds")
        .select("*")
        .eq("code", code)
        .single();
  
    await supabase
      .from("world_members")
      .insert({
        world_id: world.id,
        player_id: playerId,
      });
  
    return world;
  }