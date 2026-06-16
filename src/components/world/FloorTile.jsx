import { useTexture } from "@react-three/drei/native";
import { useMemo } from "react";
import * as THREE from "three";
import { TILE_SIZE, toIso } from "../../utils/iso";
import { ITEM_CATALOG } from "../../constants/catalog";

export default function FloorTile({ tileIndex = 0, furnitureType = null, gridX, gridZ }) {
  // 1. Load sprite sheets directly
  const floorTexture = useTexture(require("../../assets/sprites/iso_tile.png"));
  const furnitureTexture = useTexture(require("../../assets/sprites/furniture.png"));

  // 2. Set pixel-perfect filtering ONCE safely without cloning
  useMemo(() => {
    [floorTexture, furnitureTexture].forEach((tex) => {
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false; // Makes crisp pixel art render faster
      tex.needsUpdate = true;
    });
  }, [floorTexture, furnitureTexture]);

  const cols = 4;
  const rows = 4;
  const fur_cols = 3;
  const fur_rows = 3;

  // 3. Calculate UV offsets for the base floor tile
  const floorUV = useMemo(() => {
    const col = tileIndex % cols;
    const row = Math.floor(tileIndex / cols);
    return {
      repeatX: 1 / cols,
      repeatY: 1 / rows,
      offsetX: col / cols,
      offsetY: 1 - (row + 1) / rows,
    };
  }, [tileIndex]);

  // 4. Calculate UV offsets for the furniture item (if it exists)
  const furnitureUV = useMemo(() => {
    if (!furnitureType || !ITEM_CATALOG[furnitureType]) return null;

    const idx = ITEM_CATALOG[furnitureType].spriteIndex;
    const col = idx % fur_cols;
    const row = Math.floor(idx / fur_cols);

    return {
      repeatX: 1 / fur_cols,
      repeatY: 1 / fur_rows,
      offsetX: col / fur_cols,
      offsetY: 1 - (row + 1) / fur_rows,
    };
  }, [furnitureType]);

  // Map the grid coordinate using your utility function
  const isoPos = toIso(gridX, gridZ);

  return (
    <group position={[isoPos.x, 0, isoPos.z]}>
      {/* 1. Ground Layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[TILE_SIZE * 2 * 1.25, TILE_SIZE * 2 * 1.25]} />
        <meshBasicMaterial
          transparent
          map={floorTexture}
          map-repeat-x={floorUV.repeatX}
          map-repeat-y={floorUV.repeatY}
          map-offset-x={floorUV.offsetX}
          map-offset-y={floorUV.offsetY}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Furniture Layer */}
      {furnitureType && furnitureUV && (
        <mesh position={[0, 0.1, 0]}>
          <planeGeometry args={[TILE_SIZE * 2, TILE_SIZE * 2]} />
          <meshBasicMaterial
            transparent
            map={furnitureTexture}
            map-repeat-x={furnitureUV.repeatX}
            map-repeat-y={furnitureUV.repeatY}
            map-offset-x={furnitureUV.offsetX}
            map-offset-y={furnitureUV.offsetY}
            depthTest={true}
            alphaTest={0.1} // Keeps transparent edges clean without throwing out the whole texture
          />
        </mesh>
      )}
    </group>
  );
}