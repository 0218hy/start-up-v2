import { useAuthStore } from "@/stores/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NookletLoading from "../../components/nooklet/NookletLoading";
import { SafeAreaView } from "react-native-safe-area-context";
import WorldCard from "../../components/lobby/WorldCard";
import { supabase } from "../../lib/supabase";
import { startVideoSource, waitingVideoSource } from "../../utils/introVideo";

const flowerTopLeft = require("../../assets/images/nooklet/flower1.png");

export default function Landing() {
    const [worlds, setWorlds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorld, setSelectedWorld] = useState(null);
    const [isStartingWorld, setIsStartingWorld] = useState(false);
    const startTimeoutRef = useRef(null);
    const router = useRouter();

    const user = useAuthStore((state) => state.user);
    const waitingVideoPlayer = useVideoPlayer(waitingVideoSource, (player) => {
        player.loop = true;
        player.muted = true;
    });
    const startVideoPlayer = useVideoPlayer(startVideoSource, (player) => {
        player.loop = false;
        player.muted = true;
    });

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

    useEffect(() => {
        return () => {
            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!selectedWorld) return;

        if (isStartingWorld) {
            startVideoPlayer.currentTime = 0;
            startVideoPlayer.play();
            return;
        }

        waitingVideoPlayer.currentTime = 0;
        waitingVideoPlayer.play();
    }, [isStartingWorld, selectedWorld, startVideoPlayer, waitingVideoPlayer]);

    const chooseWorld = (world) => {
        if (isStartingWorld) return;

        setSelectedWorld(world);
    };

    const closeSelectedWorld = () => {
        if (isStartingWorld) return;

        setSelectedWorld(null);
        waitingVideoPlayer.pause();
    };

    const enterSelectedWorld = () => {
        if (!selectedWorld || isStartingWorld) return;

        setIsStartingWorld(true);
        waitingVideoPlayer.pause();

        startTimeoutRef.current = setTimeout(() => {
            router.push(`/world/${selectedWorld.id}`);
        }, 2400);
    };

    if (loading) {
        return <NookletLoading message="Awakening your spaces..." />;
    }

    return (
        <View style={styles.flexContainer}>
            <LinearGradient
                colors={["#FFEDD5", "#FED7AA", "#FEE2E2"]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <Image source={flowerTopLeft} style={styles.flowerAccent} resizeMode="contain" />

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
                                const world = Array.isArray(w.worlds) ? w.worlds[0] : w.worlds;
                                if (!world) return null;
                                return (
                                    <View key={w.world_id} style={styles.cardWrapper}>
                                        <WorldCard
                                            world={world}
                                            onPress={() => chooseWorld(world)}
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
                        onPress={() => router.push("/create_world")}
                    >
                        {/* Applied custom font mapping option to action targets */}
                        <Text style={styles.btnTextLight}>Create New Space</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[styles.celShadedButton, styles.joinBtn]}
                        onPress={() => router.push("/join_world")}
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

            {selectedWorld ? (
                <View style={styles.startOverlay}>
                    <VideoView
                        player={isStartingWorld ? startVideoPlayer : waitingVideoPlayer}
                        style={StyleSheet.absoluteFillObject}
                        nativeControls={false}
                        contentFit="contain"
                        playsInline
                    />
                    <View style={styles.startScrim} />
                    {!isStartingWorld ? (
                        <View style={styles.worldChoicePanel}>
                            <Text style={styles.choiceTitle}>{selectedWorld.world_name}</Text>
                            <Text style={styles.choiceSubtitle}>Space Code: {selectedWorld.code}</Text>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[styles.celShadedButton, styles.enterWorldBtn]}
                                onPress={enterSelectedWorld}
                            >
                                <Text style={styles.btnTextLight}>Join World</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                style={styles.cancelChoiceBtn}
                                onPress={closeSelectedWorld}
                            >
                                <Text style={styles.cancelChoiceText}>Choose Another Space</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 28,
    },
    flowerAccent: {
        position: "absolute",
        top: 8,
        left: -56,
        width: 190,
        height: 190,
        opacity: 0.9,
    },
    headerSection: {
        alignItems: "center",
        marginTop: 40,
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
        paddingVertical: 18,
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
        marginTop: 2,
    },
    signOutText: {
        color: "#C2410C",
        fontSize: 14,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
    startOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
        backgroundColor: "#000",
        justifyContent: "flex-end",
    },
    startScrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.18)",
    },
    worldChoicePanel: {
        marginHorizontal: 20,
        marginBottom: 28,
        padding: 20,
        borderRadius: 24,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        borderWidth: 2,
        borderColor: "rgba(253, 186, 116, 0.9)",
        alignItems: "center",
        gap: 10,
    },
    choiceTitle: {
        fontFamily: "SuperJoyful",
        color: "#431407",
        fontSize: 28,
        textAlign: "center",
    },
    choiceSubtitle: {
        color: "#9A3412",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 8,
    },
    enterWorldBtn: {
        width: "100%",
        backgroundColor: "#EA580C",
        borderColor: "#9A3412",
        shadowColor: "#9A3412",
    },
    cancelChoiceBtn: {
        height: 42,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    cancelChoiceText: {
        color: "#C2410C",
        fontSize: 14,
        fontWeight: "800",
        textDecorationLine: "underline",
    },
});
