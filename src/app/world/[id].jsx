// src/app/world.jsx
import { Canvas } from "@react-three/fiber";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView } from "expo-video"; 
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Custom Game Engine Elements
import CameraRig from "../../components/Camera";
import Controls from "../../components/MovementControls";
import Player from "../../components/Player";
import InventoryBar from "../../components/world/InventoryBar";
import SecretChatButton from "../../components/world/SecretChatButton";
import TileMap from "../../components/world/TileMap";

// Global Stores & Hooks
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useWorldTiles } from "../../hooks/useWorldTiles";
import { useBuildStore } from "../../stores/buildStore";
import { introVideoPlayer } from "../../utils/introVideo";
import { fromIso } from "../../utils/iso";

const WORLD_MIN = -25;
const WORLD_MAX = 25;
const TAP_WALK_INTERVAL_MS = 360;
const DOUBLE_TAP_DELAY_MS = 240;

function clampGrid(value) {
  return Math.max(WORLD_MIN, Math.min(WORLD_MAX, value));
}

function buildGridPath(fromX, fromZ, toX, toZ) {
  const path = [];
  let cursorX = fromX;
  let cursorZ = fromZ;
  const targetX = clampGrid(toX);
  const targetZ = clampGrid(toZ);

  while (cursorX !== targetX) {
    cursorX += Math.sign(targetX - cursorX);
    path.push({ x: cursorX, z: cursorZ });
  }

  while (cursorZ !== targetZ) {
    cursorZ += Math.sign(targetZ - cursorZ);
    path.push({ x: cursorX, z: cursorZ });
  }

  return path;
}

function GroundTapPlane({ onGroundTap }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onGroundTap(event.point);
      }}
    >
      <planeGeometry args={[240, 240]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function WorldPage() {
  const { id: worldId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isCompact = width < 720;
  const tileTapTimeoutRef = useRef(null);
  const lastTileTapRef = useRef(null);

  const {
    tiles,
    isExpanding,
    isPathFilling,
    expandTerritory,
    fillPathTiles,
    placeItem,
    rotatePlacedFurniture,
    deletePlacedFurniture,
    deleteTile
  } = useWorldTiles(worldId);

  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const user = useAuthStore((s) => s.user);
  const selectedItemId = useBuildStore((s) => s.selectedItemId);
  const resetBuild = useBuildStore((s) => s.resetBuild);
  const selectedWorldTile = useBuildStore((s) => s.selectedWorldTile);
  const selectWorldTile = useBuildStore((s) => s.selectWorldTile);
  const pathQueueLength = usePlayerStore((s) => s.pathQueue.length);
  const setPlayerPath = usePlayerStore((s) => s.setPath);
  const advancePathStep = usePlayerStore((s) => s.advancePathStep);

  useEffect(() => {
    introVideoPlayer.currentTime = 0;

    if (Platform.OS === "web") {
      introVideoPlayer.muted = true;
    }

    if (!introVideoPlayer.playing) {
      introVideoPlayer.play();
    }

    const subscription = introVideoPlayer.addListener("playToEnd", () => {
      setIsVideoPlaying(false);
    });

    return () => {
      subscription.remove();
      if (tileTapTimeoutRef.current) {
        clearTimeout(tileTapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pathQueueLength === 0) return;

    const intervalId = setInterval(() => {
      advancePathStep();
    }, TAP_WALK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [advancePathStep, pathQueueLength]);

  const handleItemDeployment = () => {
    if (!selectedItemId) return;
    const { gridX, gridZ } = usePlayerStore.getState();
    placeItem(gridX, gridZ, selectedItemId, resetBuild);
  };

  const walkToGrid = async (targetX, targetZ) => {
    const { gridX, gridZ } = usePlayerStore.getState();
    const path = buildGridPath(gridX, gridZ, targetX, targetZ);

    if (path.length === 0) return;

    const didFillPath = await fillPathTiles(path);
    if (didFillPath) {
      setPlayerPath(path);
    }
  };

  const handleTileTapAction = (clickedTile) => {
    const now = Date.now();
    const tapKey = `${clickedTile.grid_x}:${clickedTile.grid_z}`;
    const previousTap = lastTileTapRef.current;
    const isDoubleTap =
      previousTap?.key === tapKey &&
      now - previousTap.timestamp <= DOUBLE_TAP_DELAY_MS;

    if (isDoubleTap) {
      if (tileTapTimeoutRef.current) {
        clearTimeout(tileTapTimeoutRef.current);
        tileTapTimeoutRef.current = null;
      }
      lastTileTapRef.current = null;
      selectWorldTile(clickedTile);
      return;
    }

    lastTileTapRef.current = { key: tapKey, timestamp: now };
    if (tileTapTimeoutRef.current) {
      clearTimeout(tileTapTimeoutRef.current);
    }
    tileTapTimeoutRef.current = setTimeout(() => {
      tileTapTimeoutRef.current = null;
      lastTileTapRef.current = null;
      selectWorldTile(null);
      walkToGrid(clickedTile.grid_x, clickedTile.grid_z);
    }, DOUBLE_TAP_DELAY_MS);
  };

  const handleGroundTap = (point) => {
    if (tileTapTimeoutRef.current) {
      clearTimeout(tileTapTimeoutRef.current);
      tileTapTimeoutRef.current = null;
    }
    lastTileTapRef.current = null;
    selectWorldTile(null);
    const targetGrid = fromIso(point.x, point.z);
    walkToGrid(targetGrid.x, targetGrid.z);
  };

  return (
    <View style={styles.container}>

      {/* 🎬 VIDEO INTRO / LOADING WALL OVERLAY */}
      {isVideoPlaying ? (
        <View style={styles.videoContainer}>
          <VideoView
            player={introVideoPlayer}
            style={{ width, height }}
            nativeControls={false} 
            resizeMode="cover"
          />

          <View style={styles.videoOverlay}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.enterBtn}
              onPress={() => setIsVideoPlaying(false)}
            >
              <Text style={styles.enterBtnText}>Skip & Enter ➡️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* 🎮 INTERACTIVE GAME MATRIX FRAME */
        <>
          {/* OVERLAY HEADER */}
          <SafeAreaView edges={["top"]} style={styles.absoluteHeader}>
            <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Leave</Text>
            </TouchableOpacity>
            <SecretChatButton worldId={worldId} user={user} />
          </SafeAreaView>

          {/* Grid Expansion Panel */}
          <View style={[styles.expansionPanel, isCompact && styles.compactExpansionPanel, { top: insets.top + 70 }]}>
            <Text style={styles.panelTitle}>{isPathFilling ? "Building Path" : "Expand Grid"}</Text>
            <View style={styles.row}>
              <TouchableOpacity disabled={isExpanding} style={[styles.expBtn, isExpanding && styles.disabledBtn]} onPress={() => expandTerritory("north")}>
                <Text style={styles.btnText}>N</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity disabled={isExpanding} style={[styles.expBtn, isExpanding && styles.disabledBtn]} onPress={() => expandTerritory("west")}>
                <Text style={styles.btnText}>W</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isExpanding} style={[styles.expBtn, isExpanding && styles.disabledBtn]} onPress={() => expandTerritory("east")}>
                <Text style={styles.btnText}>E</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity disabled={isExpanding} style={[styles.expBtn, isExpanding && styles.disabledBtn]} onPress={() => expandTerritory("south")}>
                <Text style={styles.btnText}>S</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3D Environment */}
          <Canvas orthographic camera={{ position: [-15, 15, 15], zoom: 45, near: 0.1, far: 1000 }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[15, 25, 15]} intensity={0.5} />
            <Suspense fallback={null}>
              <GroundTapPlane onGroundTap={handleGroundTap} />
              <TileMap 
                tiles={tiles} 
                onTileTap={handleTileTapAction} 
              />
              <Player />
            </Suspense>
            <CameraRig />
          </Canvas>

          {/* 🚀 FLOATING OVERLAY HUD ACTION BUTTONS */}
          {selectedWorldTile && (
            <View style={styles.floatingActionWrapper}>
              <View style={styles.floatingBubble}>

                {selectedWorldTile.furniture_type ? (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <Text style={styles.bubbleTitle}>Item Options</Text>

                    <View style={styles.bubbleRow}>
                      <TouchableOpacity
                        style={[styles.bubbleBtn, styles.spinColor]}
                        onPress={() => rotatePlacedFurniture(
                          selectedWorldTile.grid_x,
                          selectedWorldTile.grid_z,
                          selectedWorldTile.furniture_rotation
                        )}
                      >
                        <Text style={styles.bubbleBtnText}>🔄 Spin</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.bubbleBtn, styles.deleteColor]}
                        onPress={() => deletePlacedFurniture(
                          selectedWorldTile.grid_x,
                          selectedWorldTile.grid_z
                        )}
                      >
                        <Text style={styles.bubbleBtnText}>🗑️ Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <Text style={styles.bubbleTitle}>Empty Tile Options</Text>

                    <View style={styles.bubbleRow}>
                      <TouchableOpacity
                        style={[styles.bubbleBtn, styles.deleteColor]}
                        onPress={() => deleteTile(
                          selectedWorldTile.grid_x,
                          selectedWorldTile.grid_z
                        )}
                      >
                        <Text style={styles.bubbleBtnText}>🗑️ Delete Tile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.bubbleClose}
                  onPress={() => selectWorldTile(null)}
                >
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <InventoryBar onPlaceClick={handleItemDeployment} />
          <Controls />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  videoContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", zIndex: 999999 },
  videoOverlay: { position: "absolute", bottom: 80, left: 0, right: 0, alignItems: "center", gap: 14 },
  loadingText: { color: "#64748b", fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  enterBtn: { backgroundColor: "rgba(37, 99, 235, 0.95)", paddingVertical: 14, paddingHorizontal: 26, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  enterBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  absoluteHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 99, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { backgroundColor: "rgba(30, 41, 59, 0.9)", minWidth: 100, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 24, borderWidth: 1.5, borderColor: "#334155", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  backButtonText: { color: "#cbd5e1", fontWeight: "700", fontSize: 14 },
  expansionPanel: { position: "absolute", right: 16, zIndex: 20, backgroundColor: "rgba(15, 23, 42, 0.85)", padding: 12, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  compactExpansionPanel: { right: 12, padding: 8 },
  panelTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: "row", marginVertical: 3 },
  expBtn: { backgroundColor: "#2563eb", width: 44, height: 44, justifyContent: "center", alignItems: "center", marginHorizontal: 3, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  disabledBtn: { backgroundColor: "#334155", opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  floatingActionWrapper: { position: "absolute", top: "40%", left: "50%", transform: [{ translateX: -110 }, { translateY: -50 }], zIndex: 9999 },
  floatingBubble: { backgroundColor: "rgba(15, 23, 42, 0.95)", padding: 14, borderRadius: 20, width: 220, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.15)", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  bubbleTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 },
  bubbleRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 8 },
  bubbleBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  spinColor: { backgroundColor: "#3b82f6" },
  deleteColor: { backgroundColor: "#ef4444" },
  bubbleBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  bubbleClose: { marginTop: 10, paddingVertical: 4 },
  closeText: { color: "#64748b", fontSize: 12, fontWeight: "600" }
});
