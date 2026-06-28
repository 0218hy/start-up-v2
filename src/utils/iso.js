export const TILE_SIZE = 2;

export function toIso(x, z) {
  return {
    x: (x - z) * TILE_SIZE,
    z: (x + z) * TILE_SIZE,
  };
}

export function fromIso(worldX, worldZ) {
  return {
    x: Math.round((worldX / TILE_SIZE + worldZ / TILE_SIZE) / 2),
    z: Math.round((worldZ / TILE_SIZE - worldX / TILE_SIZE) / 2),
  };
}
