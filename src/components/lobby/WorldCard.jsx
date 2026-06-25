import { Pressable, Text, StyleSheet, View } from "react-native";

export default function WorldCard({ world, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.cardContainer,
                pressed && styles.cardPressed
            ]}
        >
            <View style={styles.textContainer}>
                <Text style={styles.worldName}>
                    {world.world_name}
                </Text>
                
                <Text style={styles.worldCode}>
                    Space Code: {world.code}
                </Text>
            </View>

            <View style={styles.arrowIndicator}>
                <Text style={styles.arrowText}>➔</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        height: 72, // Clear, predictable tap target
        paddingHorizontal: 20,
        backgroundColor: "#ffffff", // Bright card surface
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#e2e8f0", // Soft slate divider outline
    },
    cardPressed: {
        backgroundColor: "#f1f5f9", // Slight elegant dimming on press
        opacity: 0.9,
    },
    textContainer: {
        flex: 1,
        justifyContent: "center",
    },
    worldName: {
        color: "#0f172a", // Sophisticated dark slate font
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.3,
    },
    worldCode: {
        color: "#64748b", // Muted secondary slate
        fontSize: 12,
        fontWeight: "500",
        marginTop: 3,
    },
    arrowIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f8fafc", // Very soft background accent for the action pointer
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    arrowText: {
        color: "#94a3b8", // Clean pastel gray arrow
        fontSize: 12,
        fontWeight: "bold",
    },
});