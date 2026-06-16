import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorldStore } from "../stores/worldStore";
import { usePlayerStore } from "../stores/playerStore";
import { ITEM_CATALOG } from "../constants/catalog";

export function useWorldTiles(worldId) {
  const [tiles, setTiles] = useState([]);
  const setGlobalTiles = useWorldStore((state) => state.setTiles);

  const syncTiles = (tilesData) => {
    setTiles(tilesData);
    setGlobalTiles(tilesData);
  };

  const loadWorldData = async () => {
    if (!worldId) return;

    const { data, error } = await supabase
      .from("world_tiles")
      .select("grid_x, grid_z, tile_type, furniture_type")
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
            tile_type: "grass",
            furniture_type: null
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
    if (!worldId) return;

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
      tile_type: "grass",
      furniture_type: null
    };

    const { error } = await supabase
      .from("world_tiles")
      .upsert([newTile], { onConflict: "world_id,grid_x,grid_z" });

    if (error) {
      console.error("Expansion failed:", error.message);
    } else {
      loadWorldData();
    }
  };

  const placeItem = async (gridX, gridZ, selectedItemId) => {
    console.log("📡 Hook: placeItem activated with parameters:", { gridX, gridZ, selectedItemId });

    if (!worldId || !selectedItemId) return;

    const itemDetails = ITEM_CATALOG[selectedItemId];
    if (!itemDetails) {
      console.log(`❌ Hook Error: Looked up ID "${selectedItemId}" in ITEM_CATALOG but found nothing!`);
      return;
    }

    console.log("📦 Hook: Catalog match found!", itemDetails);

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
    }

    console.log("🚀 Hook: Shipping payload to Supabase:", updatePayload);

    const { error } = await supabase
      .from("world_tiles")
      .upsert(updatePayload, { onConflict: "world_id,grid_x,grid_z" });

    if (error) {
      console.log("🚨 Supabase Database Error Response:", error.message);
    } else {
      console.log("✅ Supabase Success: Row upserted smoothly!");
      loadWorldData();
    }
  };

  // Keep database listeners attached automatically when component mounts
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

  return { tiles, expandTerritory, placeItem };
}