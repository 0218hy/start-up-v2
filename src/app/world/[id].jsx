import { Canvas } from "@react-three/fiber/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import CameraRig from "../../components/Camera";
import Controls from "../../components/MovementControls";
import Player from "../../components/Player";
import InventoryBar from "../../components/world/InventoryBar";
import SecretChatButton from "../../components/world/SecretChatButton";
import TileMap from "../../components/world/TileMap";

import { useAuthStore } from "@/stores/authStore";
import { useWorldTiles } from "../../hooks/useWorldTiles";
import { useBuildStore } from "../../stores/buildStore";
import { usePlayerStore } from "@/stores/playerStore";

export default function WorldPage() {
  const { id: worldId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { tiles, isPlacing, isExpanding, expandTerritory, placeItem } = useWorldTiles(worldId);
  const [selectorGrid, setSelectorGrid] = useState({ x: 0, z: 0 });

  const user = useAuthStore((state) => state.user);
  const selectedItemId = useBuildStore((state) => state.selectedItemId);
  const resetBuild = useBuildStore((state) => state.resetBuild);

  return (
    <View style={styles.container}>

      {/* 🛠️ OVERLAY HEADER: Clear tap targets */}
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

      {/* Directional Grid Expansion Panel */}
      <View style={[styles.expansionPanel, { top: insets.top + 70 }]}>
        <Text style={styles.panelTitle}>Expand Grid</Text>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => expandTerritory("north")}
          >
            <Text style={styles.btnText}>N</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => expandTerritory("west")}
          >
            <Text style={styles.btnText}>W</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => expandTerritory("east")}
          >
            <Text style={styles.btnText}>E</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isExpanding}
            style={[styles.expBtn, isExpanding && styles.disabledBtn]}
            onPress={() => expandTerritory("south")}
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

      {/* Loading Overlay Spinner Block */}
      {isPlacing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {/* Inventory Bar and Controls Handlers */}
      <InventoryBar
        onPlaceClick={() => {
          // 💡 Pull the current real-time coordinates of your character from the player store directly
          const { gridX: currentX, gridZ: currentZ } = usePlayerStore.getState();

          // Pass those coordinates to the place item script
          placeItem(currentX, currentZ, selectedItemId, resetBuild);
        }}
      />
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
  backButton: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
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
  backButtonText: {
    color: "#cbd5e1",
    fontWeight: "700",
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
    width: 44,
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