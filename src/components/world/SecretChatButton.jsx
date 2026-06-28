import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { generateAngelMortalPairs } from "../../utils/generateAngelMortal";

export default function SecretChatButton({ worldId, user }) {
    const router = useRouter();

    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showRevealModal, setShowRevealModal] = useState(false); // New State for beautiful announcements
    const [assignedMortalName, setAssignedMortalName] = useState("");

    const [daysInput, setDaysInput] = useState("1");
    const [loading, setLoading] = useState(false);

    async function handleSecretChatPress() {
        setLoading(true);
        try {
            const { data: assignment, error } = await supabase
                .from("angel_assignments")
                .select("mortal_id")
                .eq("world_id", worldId)
                .eq("angel_id", user.id)
                .maybeSingle();

            if (error) throw error;

            if (assignment) {
                router.push(`/chat/${worldId}`);
            } else {
                setShowSetupModal(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSparkGameLoop() {
        const daysNum = parseInt(daysInput, 10);
        if (isNaN(daysNum) || daysNum <= 0) return;

        setLoading(true);
        const success = await generateAngelMortalPairs(worldId, daysNum);
        setLoading(false);

        if (success) {
            setShowSetupModal(false);

            // 1. Fetch newly assigned target data
            const { data: newAssignment } = await supabase
                .from("angel_assignments")
                .select("mortal_id")
                .eq("world_id", worldId)
                .eq("angel_id", user.id)
                .single();

            // 2. Fetch target profile name
            const { data: profile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", newAssignment.mortal_id)
                .maybeSingle();

            setAssignedMortalName(profile?.username || "a secret companion");

            // 3. Open our beautiful custom announcement reveal banner!
            setShowRevealModal(true);
        }
    }

    return (
        <View>
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.secretChatBtn}
                onPress={handleSecretChatPress}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#431407" />
                ) : (
                    <Text style={styles.btnText}>🔒 Secret Chat</Text>
                )}
            </TouchableOpacity>

            {/* MODAL 1: Ignite the Hearth / Setup Configuration Sheet */}
            <Modal visible={showSetupModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ignite the Hearth 🔥</Text>
                        <Text style={styles.modalBody}>
                            {"No active game loop found! \nBe the one to start it."}
                        </Text>


                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={daysInput}
                                onChangeText={setDaysInput}
                            />
                            <Text style={styles.inputSuffixText}>days</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSetupModal(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.startBtn} onPress={handleSparkGameLoop}>
                                <Text style={styles.startText}>Spark Loop</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: ✨ THE BEAUTIFUL REVEAL POPUP ✨ */}
            <Modal visible={showRevealModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, styles.revealBorder]}>
                        <Text style={styles.sparkleIcon}>🗝️</Text>
                        <Text style={styles.modalTitle}>The Loop is Woven!</Text>
                        <Text style={styles.modalBody}>Your secret journey has officially begun.</Text>

                        <View style={styles.parchmentBadge}>
                            <Text style={styles.roleLabel}>YOU ARE THE ANGEL OF</Text>
                            <Text style={styles.mortalNameText}>✨ {assignedMortalName} ✨</Text>
                        </View>

                        <Text style={styles.instructionText}>
                            Watch over them carefully from the shadows and complete acts of kindness!
                        </Text>

                        <TouchableOpacity
                            style={styles.enterChatBtn}
                            onPress={() => {
                                setShowRevealModal(false);
                                router.push(`/chat/${worldId}`);
                            }}
                        >
                            <Text style={styles.enterChatText}>Enter Secret Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    secretChatBtn: { backgroundColor: "#FEF08A", borderWidth: 1.5, borderColor: "#CA8A04", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, minWidth: 130, alignItems: "center" },
    btnText: { fontFamily: "SuperJoyful", color: "#431407", fontSize: 14 },

    // Core Layout Structural Elements
    modalOverlay: { flex: 1, backgroundColor: "rgba(43, 13, 7, 0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalContent: { backgroundColor: "#FFFED5", borderRadius: 28, padding: 24, borderWidth: 2.5, borderColor: "#FDBA74", width: "100%", maxWidth: 320, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    revealBorder: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },

    modalTitle: { fontFamily: "SuperJoyful", fontSize: 22, color: "#431407", marginBottom: 6, textAlign: "center" },
    modalBody: { color: "#9A3412", fontSize: 13, textAlign: "center", lineHeight: 18, fontWeight: "600", marginBottom: 16 },
    modalActions: { flexDirection: "row", gap: 12, width: "100%" },
    cancelBtn: { flex: 1, height: 46, justifyContent: "center", alignItems: "center" },
    cancelText: { color: "#9A3412", fontWeight: "700" },
    startBtn: { flex: 1, height: 46, backgroundColor: "#EA580C", borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#9A3412" },
    startText: { fontFamily: "SuperJoyful", color: "#FFFFFF", fontSize: 13 },

    // --- Elegant Target Reveal Layout Additions ---
    sparkleIcon: { fontSize: 32, marginBottom: 8 },
    parchmentBadge: {
        backgroundColor: "#FEF3C7", // Pastel amber tint container box 
        borderWidth: 1.5,
        borderColor: "#F59E0B",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: "100%",
        alignItems: "center",
        marginVertical: 10,
    },
    roleLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#B45309",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    mortalNameText: {
        fontFamily: "SuperJoyful",
        fontSize: 22,
        color: "#78350F",
        textAlign: "center",
    },
    instructionText: {
        fontSize: 12,
        color: "#9A3412",
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 16,
        marginTop: 6,
        marginBottom: 20,
        paddingHorizontal: 8
    },
    enterChatBtn: {
        width: "100%",
        height: 48,
        backgroundColor: "#D97706",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#78350F",
        shadowColor: "#78350F",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    enterChatText: {
        fontFamily: "SuperJoyful",
        color: "#FFFFFF",
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8, // Adds a cozy gap between the box and the text
        marginBottom: 20,
    },
    input: { 
        height: 44, 
        width: 80, 
        backgroundColor: "#FFFFFF", 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: "#FED7AA", 
        textAlign: "center", 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#431407" 
        // Note: Removed marginBottom: 20 from here so it matches the container instead
    },
    inputSuffixText: {
        fontFamily: "SuperJoyful", // Matches your warm UI text style
        fontSize: 30,
        color: "#9A3412",
        fontWeight: "700",
    },
});
