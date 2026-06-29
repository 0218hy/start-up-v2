const INITIAL_WORLD_SIZE = 20;

const INITIAL_TILE_TYPES = [
  "grass_v1",
  "grass_v1",
  "grass_v2",
  "grass_v3",
];

function randomTileType() {
  return INITIAL_TILE_TYPES[Math.floor(Math.random() * INITIAL_TILE_TYPES.length)];
}

export function buildInitialWorldTiles(worldId: string, size = INITIAL_WORLD_SIZE) {
  const start = -Math.floor(size / 2);
  const end = start + size;
  const tiles = [];

  for (let x = start; x < end; x++) {
    for (let z = start; z < end; z++) {
      tiles.push({
        world_id: worldId,
        grid_x: x,
        grid_z: z,
        tile_type: randomTileType(),
        furniture_type: null,
        furniture_rotation: 0,
      });
    }
  }

  return tiles;
}

export async function persistInitialWorldTiles(supabaseClient: any, worldId: string) {
  const initialTiles = buildInitialWorldTiles(worldId);

  for (let i = 0; i < initialTiles.length; i += 100) {
    const { error } = await supabaseClient
      .from("world_tiles")
      .upsert(initialTiles.slice(i, i + 100), { onConflict: "world_id,grid_x,grid_z" });

    if (error) throw error;
  }

  return initialTiles;
}
