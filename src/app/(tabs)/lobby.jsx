import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import WorldCard from "../../components/lobby/WorldCard";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function Landing() {
    const [worlds, setWorlds] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const user = useAuthStore((state) => state.user);

    async function loadWorlds() {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("world_members")
                .select(`world_id, worlds (id, world_name, code)`)
                .eq("player_id", user.id);
            if (error) throw error;

            setWorlds(data || []);
        } catch (err) {
            console.error("Failed loading user worlds:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadWorlds();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Awakening your spaces...</Text>
            </View>
        );
    }

    return (
        <View style={styles.flexContainer}>
            <LinearGradient
                colors={["#FFEDD5", "#FED7AA", "#FEE2E2"]} 
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView edges={["top"]} style={styles.flexContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    <View style={styles.headerSection}>
                        {/* Custom Super Joyful typography applied here */}
                        <Text style={styles.mainHeading}>The Twilight Lounge</Text>
                        <Text style={styles.subHeading}>
                            Step through a gateway into your personal sanctuary.
                        </Text>
                    </View>

                    <View style={styles.worldsList}>
                        {worlds.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    The valley is quiet. Create a new environment or enter a shared portal code to light up this space.
                                </Text>
                            </View>
                        ) : (
                            worlds.map((w) => {
                                if (!w.worlds) return null;
                                return (
                                    <View key={w.world_id} style={styles.cardWrapper}>
                                        <WorldCard
                                            world={w.worlds}
                                            onPress={() => router.push(`world/${w.worlds.id}`)}
                                        />
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                <View style={styles.actionDock}>
                    <TouchableOpacity 
                        activeOpacity={0.85}
                        style={[styles.celShadedButton, styles.createBtn]} 
                        onPress={() => router.push("../create_world")}
                    >
                        {/* Applied custom font mapping option to action targets */}
                        <Text style={styles.btnTextLight}>Create New Space</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        activeOpacity={0.85}
                        style={[styles.celShadedButton, styles.joinBtn]} 
                        onPress={() => router.push("../join_world")}
                    >
                        <Text style={styles.btnTextDark}>Join Existing Space</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        activeOpacity={0.7}
                        style={styles.signOutBtn} 
                        onPress={async () => await supabase.auth.signOut()}
                    >
                        <Text style={styles.signOutText}>Leave Session Safely</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFEDD5",
        justifyContent: "center",
        alignItems: "center",
        gap: 12
    },
    loadingText: {
        color: "#EA580C",
        fontSize: 16,
        fontWeight: "700",
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerSection: {
        alignItems: "center",
        marginTop: 28,
        marginBottom: 32,
    },
    mainHeading: {
        fontFamily: "SuperJoyful", // Activates custom font assets
        fontSize: 34,              // Bouncy fonts look best at slightly larger text scaling sizes
        color: "#431407", 
        textAlign: "center",
        textShadowColor: "rgba(251, 191, 36, 0.4)", 
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    subHeading: {
        fontSize: 15,
        color: "#9A3412", 
        textAlign: "center",
        marginTop: 10,
        lineHeight: 22,
        fontWeight: "600",
        paddingHorizontal: 12,
    },
    worldsList: {
        width: "100%",
    },
    cardWrapper: {
        marginBottom: 14,
        shadowColor: "#7C2D12",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    emptyState: {
        backgroundColor: "rgba(255, 255, 255, 0.85)", 
        padding: 28,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#FDBA74", 
        alignItems: "center",
    },
    emptyText: {
        color: "#9A3412",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
        fontWeight: "600",
    },
    actionDock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderTopWidth: 2,
        borderTopColor: "#FDBA74",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        gap: 12,
    },
    celShadedButton: {
        height: 56,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    createBtn: {
        backgroundColor: "#EA580C", 
        borderColor: "#9A3412",
        shadowColor: "#9A3412",
    },
    joinBtn: {
        backgroundColor: "#FEF08A", 
        borderColor: "#CA8A04",
        shadowColor: "#CA8A04",
    },
    btnTextLight: {
        fontFamily: "SuperJoyful",
        color: "#FFFFFF",
        fontSize: 18,
    },
    btnTextDark: {
        fontFamily: "SuperJoyful",
        color: "#431407",
        fontSize: 18,
    },
    signOutBtn: {
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
    },
    signOutText: {
        color: "#C2410C",
        fontSize: 14,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
});