import { Canvas } from "@react-three/fiber/native";
import React from "react";
import { StyleSheet, View } from "react-native";

import CameraRig from "../../components/movement/Camera";
import Controls from "../../components/movement/MovementControls";
import Player from "../../components/Player";

export default function WorldPage() {
  return (
    <View style={styles.container}>
      <Canvas
        orthographic
        camera={{
          position: [10, 10, 10],
          zoom: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} />

        <gridHelper args={[50, 50]} />

        <Player />
        <CameraRig />
      </Canvas>

      {/* ... (Keep your D-Pad controls UI overlay layout exactly the same) */}
      <Controls />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#60a5fa",
  },
});