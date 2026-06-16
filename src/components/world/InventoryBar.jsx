import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ITEM_CATALOG } from "../../constants/catalog";
import { useBuildStore } from "../../stores/buildStore";

// 1. Import your local image assets directly
const FLOOR_SHEET = require("../../assets/sprites/iso_tile.png");
const FURNITURE_SHEET = require("../../assets/sprites/furniture.png");

const SPRITE_SIZE = 64; // The pixel size of one item tile square in your sheet
const COLS = 4;        // Your sheet layout width configuration

export default function InventoryBar({ onPlaceClick }) {
    const {
        buildMode,
        setBuildMode,
        activeTab,
        setTab,
        selectedItemId,
        selectItem
    } = useBuildStore();

    if (!buildMode) {
        return (
            <TouchableOpacity style={styles.openBtn} onPress={() => setBuildMode(true)}>
                <Text style={styles.btnText}>⚒️ Build Mode</Text>
            </TouchableOpacity>
        );
    }

    const itemsToDisplay = Object.values(ITEM_CATALOG).filter(
        (item) => item.category === activeTab
    );

    // Determine which sprite sheet to pass to the preview image frame
    const activeSheetSource = activeTab === "floor" ? FLOOR_SHEET : FURNITURE_SHEET;

    return (
        <View style={styles.container}>
            {/* Header Tabs */}
            <View style={styles.tabHeader}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "floor" && styles.activeTab]}
                    onPress={() => setTab("floor")}
                >
                    <Text style={styles.tabText}>Floors</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === "furniture" && styles.activeTab]}
                    onPress={() => setTab("furniture")}
                >
                    <Text style={styles.tabText}>Furniture</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setBuildMode(false)}>
                    <Text style={styles.btnText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Item List & Selection */}
            <View style={styles.contentRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {itemsToDisplay.map((item) => {
                        // 2. MATH CALCULATIONS: Find pixel shifts inside the sprite sheet
                        const col = item.spriteIndex % COLS;
                        const row = Math.floor(item.spriteIndex / COLS);

                        const shiftLeft = col * SPRITE_SIZE;
                        const shiftTop = row * SPRITE_SIZE;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.itemCard,
                                    selectedItemId === item.id && styles.selectedCard
                                ]}
                                onPress={() => selectItem(item.id)}
                            >
                                {/* 3. SPRITE WINDOW HOUSING FRAME */}
                                <View style={styles.spriteMask}>
                                    <Image
                                        source={activeSheetSource}
                                        style={[
                                            styles.sheetImage,
                                            {
                                                // Reposition the main sheet matrix back over the viewport mask
                                                transform: [
                                                    { translateX: -shiftLeft },
                                                    { translateY: -shiftTop }
                                                ]
                                            }
                                        ]}
                                    />
                                </View>

                                <Text style={styles.itemText}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Placement Trigger Action Button */}
                {selectedItemId && (
                    <TouchableOpacity style={styles.placeBtn} 
                    onPress={() => {
                        console.log("🎯 UI: Place button tapped! Current selected item ID is:", selectedItemId);
                        if (onPlaceClick) {
                            onPlaceClick(); 
                          } else {
                            console.warn("❌ InventoryBar Error: onPlaceClick prop was not received!");
                          } // This runs the prop function passed by WorldPage
                      }}>
                        <Text style={styles.placeBtnText}>Place</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    openBtn: { position: "absolute", bottom: 40, alignSelf: "center", backgroundColor: "#1e293b", padding: 16, borderRadius: 12, zIndex: 10 },
    container: { position: "absolute", bottom: 30, left: 16, right: 16, backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 16, padding: 12, zIndex: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    tabHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingBottom: 6, marginBottom: 10, alignItems: "center" },
    tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 },
    activeTab: { backgroundColor: "#3b82f6" },
    tabText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
    closeBtn: { marginLeft: "auto", padding: 6 },
    contentRow: { flexDirection: "row", alignItems: "center" },

    // Adjusted Card Dimensions to hold the preview artwork neatly
    itemCard: { backgroundColor: "#334155", padding: 10, borderRadius: 10, marginRight: 8, width: 85, alignItems: "center" },
    selectedCard: { borderColor: "#3b82f6", borderWidth: 2, backgroundColor: "#1e3a8a" },
    itemText: { color: "#fff", fontSize: 10, fontWeight: "600", marginTop: 6, textAlign: "center" },

    // 4. CRITICAL SPRITE CLIPPING STYLES
    spriteMask: {
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        overflow: "hidden", // Cuts off everything except our targeted box size
        backgroundColor: "transparent",
        alignItems: "flex-start",
        justifyContent: "flex-start",
    },
    sheetImage: {
        width: SPRITE_SIZE * COLS,  // Total pixel width of your 4-column sheet matrix
        height: SPRITE_SIZE * COLS, // Total pixel height of your 4-row sheet matrix
        resizeMode: "stretch",
    },

    placeBtn: { backgroundColor: "#22c55e", height: 45, paddingHorizontal: 20, borderRadius: 10, justifyContent: "center", marginLeft: 10 },
    placeBtnText: { color: "#fff", fontWeight: "bold" },
    btnText: { color: "#fff", fontWeight: "bold" }
});