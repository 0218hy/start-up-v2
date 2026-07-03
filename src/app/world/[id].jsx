// src/app/world.jsx
import { Canvas, useThree } from "@react-three/fiber";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as THREE from "three";

// Custom Game Engine Elements
import CameraRig from "../../components/Camera";
import Controls from "../../components/MovementControls";
import Player from "../../components/Player";
import InventoryBar from "../../components/world/InventoryBar";
import SecretChatButton from "../../components/world/SecretChatButton";
import TileMap from "../../components/world/TileMap";
import NookletLoading from "../../components/nooklet/NookletLoading";

// Global Stores & Hooks
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import { supabase } from "../../lib/supabase";
import { useWorldTiles } from "../../hooks/useWorldTiles";
import { useBuildStore } from "../../stores/buildStore";
import { fromIso } from "../../utils/iso";

const flowerBottomRight = require("../../assets/images/nooklet/flower2.png");

const WORLD_MIN = -25;
const WORLD_MAX = 25;
const TAP_WALK_INTERVAL_MS = 360;
const DOUBLE_TAP_DELAY_MS = 240;
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

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

function GroundTapPlane({ onGroundTap, onGroundHover }) {
  const getGroundPoint = (event) => {
    const groundPoint = new THREE.Vector3();
    event.ray.intersectPlane(GROUND_PLANE, groundPoint);
    return groundPoint;
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 1.8, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onGroundTap(getGroundPoint(event));
      }}
      onPointerMove={(event) => {
        onGroundHover(getGroundPoint(event));
      }}
    >
      <planeGeometry args={[240, 240]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function CanvasDropMapper({ mapperRef }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    mapperRef.current = { camera, element: gl.domElement };
  }, [camera, gl, mapperRef]);

  return null;
}

export default function WorldPage() {
  const { id: worldId } = useLocalSearchParams();
  const router = useRouter();
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [activeSidePanel, setActiveSidePanel] = useState(null);
  const [chatPreviewMessages, setChatPreviewMessages] = useState([]);
  const [isChatPreviewLoading, setIsChatPreviewLoading] = useState(false);
  const canvasMapperRef = useRef(null);
  const dragTargetGridRef = useRef(null);
  const tileTapTimeoutRef = useRef(null);
  const lastTileTapRef = useRef(null);

  const {
    tiles,
    isLoadingTiles,
    tileSeedError,
    fillPathTiles,
    placeItem,
    rotatePlacedFurniture,
    deletePlacedFurniture,
    deleteTile
  } = useWorldTiles(worldId);

  const user = useAuthStore((s) => s.user);
  const selectedItemId = useBuildStore((s) => s.selectedItemId);
  const setBuildMode = useBuildStore((s) => s.setBuildMode);
  const resetBuild = useBuildStore((s) => s.resetBuild);
  const selectedWorldTile = useBuildStore((s) => s.selectedWorldTile);
  const selectWorldTile = useBuildStore((s) => s.selectWorldTile);
  const playerGridX = usePlayerStore((s) => s.gridX);
  const playerGridZ = usePlayerStore((s) => s.gridZ);
  const pathQueueLength = usePlayerStore((s) => s.pathQueue.length);
  const setPlayerPath = usePlayerStore((s) => s.setPath);
  const advancePathStep = usePlayerStore((s) => s.advancePathStep);

  useEffect(() => {
    return () => {
      if (tileTapTimeoutRef.current) {
        clearTimeout(tileTapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSidePanel !== "chat" || !worldId || !user?.id) return;

    let cancelled = false;

    async function loadChatPreview() {
      try {
        setIsChatPreviewLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, text_content, created_at")
          .eq("world_id", worldId)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        if (!cancelled) {
          setChatPreviewMessages([...(data || [])].reverse());
        }
      } catch (err) {
        console.error("Failed loading chat preview:", err.message);
        if (!cancelled) setChatPreviewMessages([]);
      } finally {
        if (!cancelled) setIsChatPreviewLoading(false);
      }
    }

    loadChatPreview();

    return () => {
      cancelled = true;
    };
  }, [activeSidePanel, user?.id, worldId]);

  useEffect(() => {
    if (activeSidePanel !== "tile") return;

    const currentTile = tiles.find((tile) => tile.grid_x === playerGridX && tile.grid_z === playerGridZ);
    if (currentTile) {
      selectWorldTile(currentTile);
    }
  }, [activeSidePanel, playerGridX, playerGridZ, selectWorldTile, tiles]);

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
    placeItem(gridX, gridZ, selectedItemId, () => {
      resetBuild();
      setActiveSidePanel(null);
    });
  };

  const hasTileAt = (gridX, gridZ) => (
    tiles.some((tile) => tile.grid_x === gridX && tile.grid_z === gridZ)
  );

  const walkToGrid = async (targetX, targetZ) => {
    const { gridX, gridZ } = usePlayerStore.getState();
    const path = buildGridPath(gridX, gridZ, targetX, targetZ);

    if (path.length === 0) return;

    const canWalkPath = path.every(({ x, z }) => hasTileAt(x, z));

    if (canWalkPath) {
      setPlayerPath(path);
    } else {
      usePlayerStore.getState().clearPath();
      const didExpandPath = await fillPathTiles(path);
      if (didExpandPath) {
        setPlayerPath(path);
      }
    }
  };

  const getTileAtGrid = (gridX, gridZ) => {
    return tiles.find((tile) => tile.grid_x === gridX && tile.grid_z === gridZ);
  };

  const handleGridTap = (gridX, gridZ) => {
    const now = Date.now();
    const targetX = clampGrid(gridX);
    const targetZ = clampGrid(gridZ);
    const tapKey = `${targetX}:${targetZ}`;
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
      const tappedTile = getTileAtGrid(targetX, targetZ);
      if (tappedTile) {
        setActiveSidePanel("tile");
        setBuildMode(false);
        selectWorldTile(tappedTile);
      }
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
      walkToGrid(targetX, targetZ);
    }, DOUBLE_TAP_DELAY_MS);
  };

  const handleGroundTap = (point) => {
    const targetGrid = fromIso(point.x, point.z);
    handleGridTap(targetGrid.x, targetGrid.z);
  };

  const handleGroundHover = (point) => {
    dragTargetGridRef.current = fromIso(point.x, point.z);
  };

  const getGridFromClientPoint = (clientX, clientY) => {
    const mapper = canvasMapperRef.current;
    if (!mapper?.camera || !mapper?.element) return dragTargetGridRef.current;

    const rect = mapper.element.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1)
    );
    const raycaster = new THREE.Raycaster();
    const groundPoint = new THREE.Vector3();

    raycaster.setFromCamera(pointer, mapper.camera);
    raycaster.ray.intersectPlane(GROUND_PLANE, groundPoint);

    return fromIso(groundPoint.x, groundPoint.z);
  };

  const handleInventoryDrop = (event) => {
    const itemId = event?.dataTransfer?.getData("text/plain") || draggedItemId || selectedItemId;
    if (!itemId) return;

    const clientX = event?.clientX ?? event?.nativeEvent?.clientX;
    const clientY = event?.clientY ?? event?.nativeEvent?.clientY;
    const targetGrid = Number.isFinite(clientX) && Number.isFinite(clientY)
      ? getGridFromClientPoint(clientX, clientY)
      : dragTargetGridRef.current;

    if (!targetGrid) return;

    placeItem(clampGrid(targetGrid.x), clampGrid(targetGrid.z), itemId, () => {
      resetBuild();
      setActiveSidePanel(null);
    });
    setDraggedItemId(null);
  };

  const openChatPreview = () => {
    setActiveSidePanel((currentPanel) => currentPanel === "chat" ? null : "chat");
    setBuildMode(false);
    selectWorldTile(null);
  };

  const toggleInventoryPanel = () => {
    selectWorldTile(null);
    setActiveSidePanel((currentPanel) => {
      const nextPanel = currentPanel === "inventory" ? null : "inventory";
      setBuildMode(nextPanel === "inventory");
      return nextPanel;
    });
  };

  const openCurrentTileActions = () => {
    setActiveSidePanel("tile");
    setBuildMode(false);
    const { gridX, gridZ } = usePlayerStore.getState();
    const currentTile = getTileAtGrid(gridX, gridZ);
    if (currentTile) {
      selectWorldTile(currentTile);
    }
  };

  if (isLoadingTiles && tiles.length === 0) {
    return <NookletLoading message="Preparing your world..." />;
  }

  const expandFromSelectedTile = async (direction) => {
    if (!selectedWorldTile) return;

    const deltas = {
      north: { x: 0, z: -1 },
      west: { x: -1, z: 0 },
      east: { x: 1, z: 0 },
      south: { x: 0, z: 1 },
    };
    const delta = deltas[direction];
    const targetX = clampGrid(selectedWorldTile.grid_x + delta.x);
    const targetZ = clampGrid(selectedWorldTile.grid_z + delta.z);

    await fillPathTiles([{ x: targetX, z: targetZ }]);
  };

  const closeTileActionPanel = () => {
    selectWorldTile(null);
    setActiveSidePanel(null);
  };

  const isRightPanelOpen = activeSidePanel === "chat" || activeSidePanel === "inventory" || activeSidePanel === "tile";

  return (
    <View style={styles.container}>
      <>
          {/* OVERLAY HEADER */}
          <Image source={flowerBottomRight} style={styles.flowerAccent} resizeMode="contain" />

          <SafeAreaView edges={["top"]} style={styles.absoluteHeader}>
            <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => router.replace("/lobby")}>
              <Text style={styles.backButtonText}>← Leave</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <SafeAreaView edges={["bottom"]} style={styles.bottomLeftDock}>
            <SecretChatButton
              worldId={worldId}
              user={user}
              iconOnly
              onOpenPreview={openChatPreview}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.hudIconButton, activeSidePanel === "inventory" && styles.activeHudIconButton]}
              onPress={toggleInventoryPanel}
            >
              <Text style={styles.hudIconText}>🎒</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.hudIconButton, activeSidePanel === "tile" && styles.activeHudIconButton]}
              onPress={openCurrentTileActions}
            >
              <Text style={styles.hudIconText}>🛠️</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* 3D Environment */}
          <View
            style={styles.canvasDropZone}
            onDragOver={(event) => event.preventDefault?.()}
            onDrop={(event) => {
              event.preventDefault?.();
              handleInventoryDrop(event);
            }}
          >
            <Canvas orthographic camera={{ position: [-15, 15, 15], zoom: 45, near: 0.1, far: 1000 }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[15, 25, 15]} intensity={0.5} />
              <Suspense fallback={null}>
                <CanvasDropMapper mapperRef={canvasMapperRef} />
                <GroundTapPlane onGroundTap={handleGroundTap} onGroundHover={handleGroundHover} />
                <TileMap 
                  tiles={tiles} 
                />
                <Player />
              </Suspense>
              <CameraRig avoidRightPanel={isRightPanelOpen} />
            </Canvas>
          </View>

          {(isLoadingTiles || tileSeedError) && (
            <View style={styles.tileStatusBadge}>
              <Text style={styles.tileStatusText}>
                {tileSeedError ? `Using local starter tiles` : "Preparing starter tiles"}
              </Text>
            </View>
          )}

          {selectedWorldTile && activeSidePanel === "tile" && (
            <View style={styles.tileActionPanel}>
              <View style={styles.sidePanelHeader}>
                <Text style={styles.sidePanelEmoji}>🛠️</Text>
                <TouchableOpacity
                  style={styles.sidePanelClose}
                  onPress={() => {
                    selectWorldTile(null);
                    setActiveSidePanel(null);
                  }}
                >
                  <Text style={styles.sidePanelCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tileActionContent}>
                <Text style={styles.bubbleTitle}>Expand Tile</Text>
                <View style={styles.expandPad}>
                  <TouchableOpacity style={[styles.expandPadBtn, styles.expandNorth]} onPress={async () => {
                    await expandFromSelectedTile("north");
                    closeTileActionPanel();
                  }}>
                    <Text style={styles.expandPadText}>N</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.expandPadBtn, styles.expandWest]} onPress={async () => {
                    await expandFromSelectedTile("west");
                    closeTileActionPanel();
                  }}>
                    <Text style={styles.expandPadText}>W</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.expandPadBtn, styles.expandEast]} onPress={async () => {
                    await expandFromSelectedTile("east");
                    closeTileActionPanel();
                  }}>
                    <Text style={styles.expandPadText}>E</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.expandPadBtn, styles.expandSouth]} onPress={async () => {
                    await expandFromSelectedTile("south");
                    closeTileActionPanel();
                  }}>
                    <Text style={styles.expandPadText}>S</Text>
                  </TouchableOpacity>
                </View>

                {selectedWorldTile.furniture_type ? (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <Text style={styles.bubbleTitle}>Item Options</Text>

                    <View style={styles.bubbleRow}>
                      <TouchableOpacity
                        style={[styles.bubbleBtn, styles.spinColor]}
                        onPress={async () => {
                          await rotatePlacedFurniture(
                            selectedWorldTile.grid_x,
                            selectedWorldTile.grid_z,
                            selectedWorldTile.furniture_rotation
                          );
                          closeTileActionPanel();
                        }}
                      >
                        <Text style={styles.bubbleBtnText}>🔄 Spin</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.bubbleBtn, styles.deleteColor]}
                        onPress={async () => {
                          await deletePlacedFurniture(
                            selectedWorldTile.grid_x,
                            selectedWorldTile.grid_z
                          );
                          closeTileActionPanel();
                        }}
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
                        onPress={async () => {
                          await deleteTile(
                            selectedWorldTile.grid_x,
                            selectedWorldTile.grid_z
                          );
                          closeTileActionPanel();
                        }}
                      >
                        <Text style={styles.bubbleBtnText}>🗑️ Delete Tile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.bubbleClose}
                  onPress={() => {
                    selectWorldTile(null);
                    setActiveSidePanel(null);
                  }}
                >
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {activeSidePanel === "chat" && (
            <View style={styles.chatPreviewPanel}>
              <View style={styles.sidePanelHeader}>
                <Text style={styles.sidePanelEmoji}>💬</Text>
                <TouchableOpacity style={styles.sidePanelClose} onPress={() => setActiveSidePanel(null)}>
                  <Text style={styles.sidePanelCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.chatPreviewContent}
              >
                {isChatPreviewLoading ? (
                  <Text style={styles.chatPreviewMeta}>...</Text>
                ) : chatPreviewMessages.length === 0 ? (
                  <Text style={styles.chatPreviewMeta}>No whispers yet.</Text>
                ) : (
                  chatPreviewMessages.map((message) => {
                    const isMe = message.sender_id === user?.id;
                    return (
                      <View
                        key={message.id}
                        style={[styles.previewBubble, isMe ? styles.previewBubbleMine : styles.previewBubbleTheirs]}
                      >
                        <Text
                          style={[styles.previewBubbleText, isMe ? styles.previewBubbleTextMine : styles.previewBubbleTextTheirs]}
                          numberOfLines={3}
                        >
                          {message.text_content}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.openChatButton}
                onPress={() => router.push(`/chat/${worldId}`)}
              >
                <Text style={styles.openChatButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          )}

          <InventoryBar
            variant="side"
            onPlaceClick={handleItemDeployment}
            onItemDragStart={setDraggedItemId}
            onItemDragEnd={() => setDraggedItemId(null)}
            onClose={() => setActiveSidePanel(null)}
          />
          <Controls />
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  canvasDropZone: { flex: 1 },
  videoContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", zIndex: 999999 },
  videoOverlay: { position: "absolute", bottom: 80, left: 0, right: 0, alignItems: "center", gap: 14 },
  loadingText: { color: "#64748b", fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  enterBtn: { backgroundColor: "rgba(37, 99, 235, 0.95)", paddingVertical: 14, paddingHorizontal: 26, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  enterBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  flowerAccent: { position: "absolute", right: -70, bottom: -52, width: 220, height: 220, opacity: 0.9, zIndex: 10 },
  absoluteHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 99, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { backgroundColor: "rgba(30, 41, 59, 0.9)", minWidth: 100, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 24, borderWidth: 1.5, borderColor: "#334155", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  backButtonText: { color: "#cbd5e1", fontWeight: "700", fontSize: 14 },
  bottomLeftDock: { position: "absolute", left: 16, bottom: 18, zIndex: 100000, flexDirection: "row", gap: 10, alignItems: "center" },
  hudIconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FEF08A", borderWidth: 1.5, borderColor: "#CA8A04", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 4, elevation: 6 },
  activeHudIconButton: { backgroundColor: "#FDBA74", borderColor: "#EA580C" },
  hudIconText: { fontSize: 22 },
  chatPreviewPanel: { position: "absolute", top: 92, right: 14, bottom: 160, width: 172, zIndex: 99998, backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  tileActionPanel: { position: "absolute", top: 92, right: 14, bottom: 160, width: 172, zIndex: 99998, backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  sidePanelHeader: { height: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sidePanelEmoji: { fontSize: 20 },
  sidePanelClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },
  sidePanelCloseText: { color: "#fff", fontSize: 18, fontWeight: "800", lineHeight: 20 },
  chatPreviewContent: { gap: 8, paddingBottom: 8 },
  tileActionContent: { alignItems: "center", paddingBottom: 8 },
  chatPreviewMeta: { color: "#CBD5E1", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 20 },
  previewBubble: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1 },
  previewBubbleMine: { backgroundColor: "#FEF08A", borderColor: "#CA8A04", alignSelf: "flex-end" },
  previewBubbleTheirs: { backgroundColor: "#EA580C", borderColor: "#9A3412", alignSelf: "flex-start" },
  previewBubbleText: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
  previewBubbleTextMine: { color: "#431407" },
  previewBubbleTextTheirs: { color: "#FFFFFF" },
  openChatButton: { height: 40, borderRadius: 16, backgroundColor: "#FEF08A", borderWidth: 1.5, borderColor: "#CA8A04", justifyContent: "center", alignItems: "center", marginTop: 8 },
  openChatButtonText: { fontSize: 18 },
  expansionPanel: { position: "absolute", right: 16, zIndex: 20, backgroundColor: "rgba(15, 23, 42, 0.85)", padding: 12, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  compactExpansionPanel: { right: 12, padding: 8 },
  panelTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: "row", marginVertical: 3 },
  expBtn: { backgroundColor: "#2563eb", width: 44, height: 44, justifyContent: "center", alignItems: "center", marginHorizontal: 3, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  disabledBtn: { backgroundColor: "#334155", opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  tileStatusBadge: { position: "absolute", left: 16, bottom: 118, zIndex: 40, backgroundColor: "rgba(15, 23, 42, 0.86)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  tileStatusText: { color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  floatingActionWrapper: { position: "absolute", top: "40%", left: "50%", transform: [{ translateX: -110 }, { translateY: -50 }], zIndex: 9999 },
  floatingBubble: { backgroundColor: "rgba(15, 23, 42, 0.95)", padding: 14, borderRadius: 20, width: 230, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.15)", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  bubbleTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 },
  expandPad: { width: 132, height: 120, marginBottom: 14, position: "relative" },
  expandPadRow: { flexDirection: "row", gap: 34, marginVertical: 6 },
  expandPadBtn: { position: "absolute", width: 38, height: 38, borderRadius: 8, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 3, transform: [{ rotate: "45deg" }] },
  expandNorth: { left: 47, top: 4, backgroundColor: "#38BDF8" },
  expandWest: { left: 16, top: 41, backgroundColor: "#60A5FA" },
  expandEast: { right: 16, top: 41, backgroundColor: "#2563EB" },
  expandSouth: { left: 47, bottom: 4, backgroundColor: "#1D4ED8" },
  expandPadText: { color: "#fff", fontWeight: "900", fontSize: 13, transform: [{ rotate: "-45deg" }] },
  bubbleRow: { width: "100%", gap: 8 },
  bubbleBtn: { width: "100%", height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  spinColor: { backgroundColor: "#3b82f6" },
  deleteColor: { backgroundColor: "#ef4444" },
  bubbleBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  bubbleClose: { marginTop: 10, paddingVertical: 4 },
  closeText: { color: "#64748b", fontSize: 12, fontWeight: "600" }
});
