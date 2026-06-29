// 📁 src/components/world/InventoryBar.jsx
import React from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ITEM_CATALOG, SPRITE_SHEETS } from "../../constants/catalog";
import { useBuildStore } from "../../stores/buildStore";

const PREVIEW_BOX_SIZE = 48; // 🎨 Size of the icon preview container box
export const INVENTORY_TABS = [
    { id: "floor", label: "Floors" },
    { id: "furniture", label: "Furniture" },
    { id: "food", label: "Food" }
];

function InventorySpritePreview({ item, size = PREVIEW_BOX_SIZE }) {
    const frameSize = item.frameSize || 64;
    const visualSize = item.size || frameSize;
    const itemCols = item.cols || 4;
    const itemRows = item.rows || 4;
    const activeSheetSource = SPRITE_SHEETS[item.sheet];

    const col = item.spriteIndex % itemCols;
    const row = Math.floor(item.spriteIndex / itemCols);
    const leftOffset = -col * frameSize;
    const topOffset = -row * frameSize;
    const scale = Math.min(1, visualSize / frameSize) * (size / frameSize);

    return (
        <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
            <View style={{
                width: frameSize,
                height: frameSize,
                overflow: "hidden",
                position: "absolute",
                transform: [{ scale }]
            }}>
                <Image
                    source={activeSheetSource}
                    style={{
                        position: "absolute",
                        width: frameSize * itemCols,
                        height: frameSize * itemRows,
                        left: leftOffset,
                        top: topOffset,
                        resizeMode: "stretch"
                    }}
                />
            </View>
        </View>
    );
}

export default function InventoryBar({ onPlaceClick, onItemDragStart, onItemDragEnd }) {
    const { buildMode, setBuildMode, activeTab, setTab, selectedItemId, selectItem } = useBuildStore();

    if (!buildMode) {
        return (
            <TouchableOpacity style={styles.openBtn} onPress={() => setBuildMode(true)}>
                <Text style={styles.btnText}>⚒️ Build Mode</Text>
            </TouchableOpacity>
        );
    }

    const itemsToDisplay = Object.values(ITEM_CATALOG).filter(item => item.category === activeTab);

    return (
        <View style={styles.container}>
            <View>
                <View style={styles.tabHeader}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                        {INVENTORY_TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                                onPress={() => setTab(tab.id)}
                            >
                                <Text style={styles.tabText}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setBuildMode(false)}>
                        <Text style={styles.btnText}>✕</Text>
                    </TouchableOpacity> 
                </View>

                <View style={styles.contentRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {itemsToDisplay.map((item) => {
                            const itemCard = (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.itemCard, selectedItemId === item.id && styles.selectedCard]}
                                    onPress={() => selectItem(item.id)}
                                >
                                    <InventorySpritePreview item={item} />
                                    <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
                                </TouchableOpacity>
                            );

                            if (Platform.OS !== "web") {
                                return itemCard;
                            }

                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(event) => {
                                        selectItem(item.id);
                                        event.dataTransfer.setData("text/plain", item.id);
                                        event.dataTransfer.effectAllowed = "copy";
                                        onItemDragStart?.(item.id);
                                    }}
                                    onDragEnd={() => onItemDragEnd?.()}
                                    style={{ display: "inline-block", cursor: "grab" }}
                                >
                                    {itemCard}
                                </div>
                            );
                        })}
                    </ScrollView>

                    {selectedItemId && (
                        <TouchableOpacity style={styles.placeBtn} onPress={onPlaceClick}>
                            <Text style={styles.placeBtnText}>Place</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    openBtn: { position: "absolute", bottom: 40, left: 24, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, zIndex: 99999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    container: { position: "absolute", bottom: 30, left: 16, right: 16, backgroundColor: "rgba(15, 23, 42, 0.95)", borderRadius: 16, padding: 12, zIndex: 99999 },
    tabHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingBottom: 6, marginBottom: 10 },
    tabScroll: { flexGrow: 1, flexDirection: "row" }, 
    tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 },
    activeTab: { backgroundColor: "#3b82f6" },
    tabText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
    closeBtn: { padding: 6, marginLeft: 10 },
    contentRow: { flexDirection: "row", alignItems: "center" },
    itemCard: { backgroundColor: "#334155", padding: 8, borderRadius: 10, marginRight: 8, width: 75, alignItems: "center" },
    selectedCard: { borderColor: "#3b82f6", borderWidth: 2, backgroundColor: "#1e3a8a" },
    itemText: { color: "#fff", fontSize: 10, fontWeight: "600", marginTop: 4, textAlign: "center", width: "100%" },
    placeBtn: { backgroundColor: "#22c55e", height: 45, paddingHorizontal: 12, borderRadius: 10, justifyContent: "center", marginLeft: 10 },
    placeBtnText: { color: "#fff", fontWeight: "bold" }
});
