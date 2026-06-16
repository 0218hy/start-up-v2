import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function FullScreenChatHeader() {
  const router = useRouter();

  return (
    // Edges=["top"] ensures it exclusively pads out the status bar notch at the top of the device screen
    <SafeAreaView edges={["top"]} style={styles.headerBG}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Anonymous Inbox</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBG: {
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderColor: "#1f2937",
  },
  headerContent: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  backButton: {
    color: "#38bdf8",
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});