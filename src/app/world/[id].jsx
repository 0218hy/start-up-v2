import { Canvas } from "@react-three/fiber/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import CameraRig from "../../components/Camera";
import Controls from "../../components/MovementControls";
import Player from "../../components/Player";
import InventoryBar from "../../components/world/InventoryBar";
import TileMap from "../../components/world/TileMap";
import SecretChatButton from "../../components/world/SecretChatButton"

import { useWorldTiles } from "../../hooks/useWorldTiles";
import { useBuildStore } from "../../stores/buildStore";
import { useAuthStore } from "@/stores/authStore";

export default function WorldPage() {
  const { id: worldId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Dynamically pushes the layout below physical hardware boundaries

  const { tiles, expandTerritory, placeItem } = useWorldTiles(worldId);
  const [selectorGrid, setSelectorGrid] = useState({ x: 0, z: 0 });
  const [isPlacing, setIsPlacing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const user = useAuthStore((state) => state.user);
  const selectedItemId = useBuildStore((state) => state.selectedItemId);
  const resetBuild = useBuildStore((state) => state.resetBuild);

  const handleOnPlaceConfirm = async () => {
    if (!selectedItemId || isPlacing) return;
    try {
      setIsPlacing(true);
      await placeItem(selectorGrid.x, selectorGrid.z, selectedItemId);
      resetBuild();
    } catch (err) {
      console.error("Failed to place item:", err);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleExpand = async (direction) => {
    if (isExpanding) return;
    try {
      setIsExpanding(true);
      await expandTerritory(direction);
    } catch (err) {
      console.error("Expansion error:", err);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* 🛠️ IMPROVED OVERLAY HEADER: Generous, clear tap targets */}
      <SafeAreaView edges={["top"]} style={styles.absoluteHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Leave</Text>
        </TouchableOpacity>

        <SecretChatButton worldId={worldId} user={user} />
      </SafeAreaView>

      {/* Directional Grid Expansion Panel - Shifted dynamically to drop below the safe header zone */}
      <View style={[styles.expansionPanel, { top: insets.top + 70 }]}>
        <Text style={styles.panelTitle}>Expand Grid</Text>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => handleExpand("north")}
          >
            <Text style={styles.btnText}>N</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => handleExpand("west")}
          >
            <Text style={styles.btnText}>W</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => handleExpand("east")}
          >
            <Text style={styles.btnText}>E</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => handleExpand("south")}
          >
            <Text style={styles.btnText}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Game Canvas Environment */}
      <Canvas
        orthographic
        camera={{
          position: [-15, 15, 15],
          zoom: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[15, 25, 15]} intensity={0.5} />
        <Suspense fallback={null}>
          <TileMap tiles={tiles} />
          <Player />
        </Suspense>
        <CameraRig />
      </Canvas>

      {isPlacing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      <InventoryBar onPlaceClick={handleOnPlaceConfirm} />
      <Controls setSelectorGrid={setSelectorGrid} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a"
  },
  absoluteHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Boosted target dimensions to clear fat-finger mistakes
  backButton: {
    backgroundColor: "rgba(30, 41, 59, 0.9)", // Sleek glass slate
    minWidth: 100,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  chatShortcutBtn: {
    backgroundColor: "#0284c7", // Deep vibrant sky blue
    minWidth: 140,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  backButtonText: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 14,
  },
  chatButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  expansionPanel: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155"
  },
  panelTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6
  },
  row: {
    flexDirection: "row",
    marginVertical: 3
  },
  expBtn: {
    backgroundColor: "#2563eb",
    width: 44, // Expanded touch sizes for game direction navigation keys
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledBtn: {
    backgroundColor: "#334155",
    opacity: 0.5
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  }
});