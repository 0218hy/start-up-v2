import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorldStore } from "../stores/worldStore";
import { usePlayerStore } from "../stores/playerStore";
import { useBuildStore } from "../stores/buildStore"; // 💡 Added missing store import for local UI sync
import { ITEM_CATALOG } from "../constants/catalog";

export function useWorldTiles(worldId) {
  const [tiles, setTiles] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const setGlobalTiles = useWorldStore((state) => state.setTiles);

  const syncTiles = (tilesData) => {
    setTiles(tilesData);
    setGlobalTiles(tilesData);
  };

  const loadWorldData = async () => {
    if (!worldId) return;

    const { data, error } = await supabase
      .from("world_tiles")
      // 🌟 Cleanly fetching the rotation column
      .select("grid_x, grid_z, tile_type, furniture_type, furniture_rotation")
      .eq("world_id", worldId);

    if (error) {
      console.error("Error loading map:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      const initial3x3 = [];
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          initial3x3.push({
            world_id: worldId,
            grid_x: x,
            grid_z: z,
            tile_type: "grass_v1",
            furniture_type: null,
            furniture_rotation: 0 // Default newly created grids safely
          });
        }
      }
      await supabase.from("world_tiles").insert(initial3x3);
      syncTiles(initial3x3);
    } else {
      syncTiles(data);
    }
  };

  const expandTerritory = async (direction) => {
    if (!worldId || isExpanding) return;

    try {
      setIsExpanding(true);
      const { gridX: playerX, gridZ: playerZ } = usePlayerStore.getState();

      let targetX = playerX;
      let targetZ = playerZ;

      switch (direction) {
        case "north": targetZ = playerZ - 1; break;
        case "south": targetZ = playerZ + 1; break;
        case "west":  targetX = playerX - 1; break;
        case "east":  targetX = playerX + 1; break;
      }

      if (targetX < -25 || targetX > 25 || targetZ < -25 || targetZ > 25) {
        console.warn("Expansion halted: World boundary edge reached!");
        return;
      }

      const newTile = {
        world_id: worldId,
        grid_x: targetX,
        grid_z: targetZ,
        tile_type: "grass_v1",
        furniture_type: null,
        furniture_rotation: 0
      };

      const { error } = await supabase
        .from("world_tiles")
        .upsert([newTile], { onConflict: "world_id,grid_x,grid_z" });

      if (error) {
        console.error("Expansion failed:", error.message);
      } else {
        await loadWorldData();
      }
    } catch (err) {
      console.error("Territory expand exception:", err.message);
    } finally {
      setIsExpanding(false);
    }
  };

  const placeItem = async (gridX, gridZ, selectedItemId, onResetBuildCallback) => {
    if (!worldId || !selectedItemId || isPlacing) return;

    try {
      setIsPlacing(true);
      const itemDetails = ITEM_CATALOG[selectedItemId];
      if (!itemDetails) return;

      let updatePayload = {
        world_id: worldId,
        grid_x: gridX,
        grid_z: gridZ,
        placed_at: new Date().toISOString()
      };

      if (itemDetails.category === "floor") {
        updatePayload.tile_type = selectedItemId.replace("tile_", "");
      } else if (itemDetails.category === "furniture") {
        updatePayload.furniture_type = selectedItemId;
        // 💡 Initial placements start facing straight forward (0)
        updatePayload.furniture_rotation = 0; 
      }

      const { error } = await supabase
        .from("world_tiles")
        .upsert(updatePayload, { onConflict: "world_id,grid_x,grid_z" });

      if (error) {
        console.log("🚨 Supabase Database Error Response:", error.message);
      } else {
        await loadWorldData();
        if (onResetBuildCallback) onResetBuildCallback();
      }
    } catch (err) {
      console.error("Item deployment exception:", err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  const rotatePlacedFurniture = async (gridX, gridZ, currentRotation) => {
    if (!worldId) return;
  
    try {
      // 🛡️ SAFE FALLBACK: If currentRotation is undefined/null/snake_case mismatch, parse to 0
      const baseRotation = isNaN(parseInt(currentRotation, 10)) ? 0 : parseInt(currentRotation, 10);
      const nextRotation = (baseRotation + 1) % 4;

      const { error } = await supabase
        .from("world_tiles")
        .update({ furniture_rotation: nextRotation })
        // 💡 EXPLICIT CHAINS: Swapped out .match() to prevent reference syntax runtime errors
        .eq("world_id", worldId)
        .eq("grid_x", gridX)
        .eq("grid_z", gridZ);
  
      if (error) {
        console.error("🚨 Failed to rotate furniture in DB:", error.message);
      } else {
        await loadWorldData(); // Refresh graphics matrices
        
        // Push update back to Zustand so InventoryBar layout panel stays beautifully accurate
        const updatedTile = tiles.find(t => t.grid_x === gridX && t.grid_z === gridZ);
        if (updatedTile) {
          useBuildStore.getState().selectWorldTile({
            ...updatedTile,
            furniture_rotation: nextRotation
          });
        }
      }
    } catch (err) {
      console.error("Rotation operation crash exception:", err);
    }
  };

  const deletePlacedFurniture = async (gridX, gridZ) => {
    if (!worldId) return;
  
    try {
      const { error } = await supabase
        .from("world_tiles")
        .update({ furniture_type: null, furniture_rotation: 0 }) // Wipe the asset data fields
        .eq("world_id", worldId)
        .eq("grid_x", gridX)
        .eq("grid_z", gridZ);
  
      if (error) {
        console.error("🚨 Failed to remove asset from DB:", error.message);
      } else {
        await loadWorldData(); // Trigger structural redraw
        useBuildStore.getState().selectWorldTile(null); // Clear selected state overlay
      }
    } catch (err) {
      console.error("Delete operation exception:", err);
    }
  };

  const deleteTile = async (gridX, gridZ) => {
    if (!worldId) return;
  
    try {
      const { error } = await supabase
        .from("world_tiles")
        .delete() // 🗑️ Completely drops the row from the database
        .eq("world_id", worldId)
        .eq("grid_x", gridX)
        .eq("grid_z", gridZ);
  
      if (error) {
        console.error("🚨 Failed to delete tile from DB:", error.message);
      } else {
        await loadWorldData(); // Reload the map to reflect the missing tile
        useBuildStore.getState().selectWorldTile(null); // Clear active selection UI
      }
    } catch (err) {
      console.error("Tile deletion crash exception:", err);
    }
  };

  useEffect(() => {
    if (!worldId) return;
    
    loadWorldData();

    const channel = supabase
      .channel(`world-${worldId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "world_tiles" },
        (payload) => {
          const row = payload.new || payload.old;
          if (row && row.world_id === worldId) {
            loadWorldData();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [worldId]);

  return { tiles, isPlacing, isExpanding, expandTerritory, placeItem, rotatePlacedFurniture, deletePlacedFurniture, deleteTile};
}