export const TILE_SIZE = 2;

export function toIso(x, z) {
  return {
    x: (x - z) * TILE_SIZE,
    z: (x + z) * TILE_SIZE,
  };
}
