import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TileExpansion({ onExpand }) {
  return (
    <View style={styles.expansionPanel}>
      <Text style={styles.panelTitle}>Expand Territory</Text>
      
      {/* North Button */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.expBtn} onPress={() => onExpand("north")}>
          <Text style={styles.btnText}>▲</Text>
        </TouchableOpacity>
      </View>
      
      {/* West & East Buttons */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.expBtn} onPress={() => onExpand("west")}>
          <Text style={styles.btnText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expBtn} onPress={() => onExpand("east")}>
          <Text style={styles.btnText}>▶</Text>
        </TouchableOpacity>
      </View>
      
      {/* South Button */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.expBtn} onPress={() => onExpand("south")}>
          <Text style={styles.btnText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expansionPanel: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 50, // Ensures it stays cleanly on top of the 3D Canvas
    backgroundColor: "rgba(30, 41, 59, 0.85)", // Sleek slate color with blur/transparency
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  panelTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    marginVertical: 3
  },
  expBtn: {
    backgroundColor: "#3b82f6",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    elevation: 3, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});