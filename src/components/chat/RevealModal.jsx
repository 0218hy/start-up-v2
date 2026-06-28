import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function RevealModal({ visible, worldId, userId, onClose, onResetSuccess }) {
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetError, setResetError] = useState("");
  const [myAngel, setMyAngel] = useState("Loading...");
  const [myMortal, setMyMortal] = useState("Loading...");

  useEffect(() => {
    if (visible && worldId && userId) {
      fetchRevealData();
    }
  }, [visible, worldId, userId]);

  async function fetchRevealData() {
    try {
      setLoading(true);
      const { data: mortalData } = await supabase.from("angel_assignments").select("mortal_id").eq("world_id", worldId).eq("angel_id", userId).maybeSingle();
      const { data: angelData } = await supabase.from("angel_assignments").select("angel_id").eq("world_id", worldId).eq("mortal_id", userId).maybeSingle();

      if (mortalData?.mortal_id) {
        const { data: p1 } = await supabase.from("profiles").select("username").eq("id", mortalData.mortal_id).maybeSingle();
        if (p1?.username) setMyMortal(p1.username);
      } else { setMyMortal("None"); }

      if (angelData?.angel_id) {
        const { data: p2 } = await supabase.from("profiles").select("username").eq("id", angelData.angel_id).maybeSingle();
        if (p2?.username) setMyAngel(p2.username);
      } else { setMyAngel("None"); }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPairs() {
    setConfirmingReset(true);
    setResetError("");
  }

  async function confirmResetPairs() {
    try {
      setResetting(true);
      setResetError("");

      const { error: assignmentError } = await supabase
        .from("angel_assignments")
        .delete()
        .eq("world_id", worldId);
      if (assignmentError) throw assignmentError;

      const { error: messageError } = await supabase
        .from("messages")
        .delete()
        .eq("world_id", worldId);
      if (messageError) throw messageError;

      const now = new Date().toISOString();
      const { error: stateError } = await supabase
        .from("world_chat_states")
        .upsert({
          world_id: worldId,
          loop_revealed: false,
          chat_started_at: now,
          updated_at: now,
        }, { onConflict: "world_id" });
      if (stateError) throw stateError;

      setConfirmingReset(false);
      if (onResetSuccess) onResetSuccess();
    } catch (err) {
      console.error("Reset game loop failed:", err.message);
      setResetError(err.message || "Reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {confirmingReset ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Reset game loop?</Text>
            <Text style={styles.confirmBody}>
              This clears all pairings and chat history for this room. Players can start a fresh loop after reset.
            </Text>
            {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelResetButton}
                onPress={() => setConfirmingReset(false)}
                disabled={resetting}
              >
                <Text style={styles.cancelResetText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmResetButton}
                onPress={confirmResetPairs}
                disabled={resetting}
              >
                {resetting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmResetText}>Reset</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.xCloseButton} onPress={onClose}>
              <Text style={styles.xCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.title}>The Circle is Revealed!</Text>
            <Text style={styles.subtitle}>The connections are open! Here are your secret assignments:</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={styles.parchmentBox}>
                  <Text style={styles.summaryLine}>Your Secret Angel was:{"\n"}<Text style={styles.highlightText}>✨ {myAngel} ✨</Text></Text>
                  <View style={styles.divider} />
                  <Text style={styles.summaryLine}>You were protecting:{"\n"}<Text style={styles.highlightText}>🎯 {myMortal}</Text></Text>
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={handleResetPairs} disabled={resetting}>
                  {resetting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.resetButtonText}>🔄 Reset Game Loop</Text>
                  )}
                </TouchableOpacity>
                {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  cardContainer: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 24, borderWidth: 2, borderColor: "#F59E0B", width: "100%", maxWidth: 320, alignItems: "center", position: "relative" },
  xCloseButton: { position: "absolute", top: 14, right: 16, width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  xCloseText: { fontSize: 18, fontWeight: "bold", color: "#9A3412" },
  celebrationEmoji: { fontSize: 36, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#431407", textAlign: "center" },
  subtitle: { color: "#9A3412", fontSize: 13, textAlign: "center", fontWeight: "500", marginBottom: 16, marginTop: 4 },
  parchmentBox: { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#D97706", borderRadius: 14, padding: 16, width: "100%", marginTop: 8, gap: 12 },
  summaryLine: { fontSize: 14, fontWeight: "700", color: "#78350F", textAlign: "center" },
  highlightText: { fontSize: 16, color: "#EA580C", fontWeight: "900", lineHeight: 24 },
  divider: { height: 1, backgroundColor: "#FED7AA", marginVertical: 4 },
  resetButton: { width: "100%", height: 42, backgroundColor: "#10B981", borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: "#065F46" },
  resetButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  confirmCard: { backgroundColor: "#FFFBEB", borderRadius: 20, padding: 20, width: "100%", maxWidth: 320, borderWidth: 2, borderColor: "#F59E0B" },
  confirmTitle: { color: "#431407", fontSize: 18, fontWeight: "800", textAlign: "center" },
  confirmBody: { color: "#9A3412", fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 8, marginBottom: 16 },
  confirmActions: { flexDirection: "row", gap: 10 },
  cancelResetButton: { flex: 1, height: 42, justifyContent: "center", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: "#D97706" },
  cancelResetText: { color: "#9A3412", fontWeight: "700" },
  confirmResetButton: { flex: 1, height: 42, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "#DC2626", borderWidth: 1, borderColor: "#991B1B" },
  confirmResetText: { color: "#FFFFFF", fontWeight: "800" },
  errorText: { color: "#B91C1C", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 10 }
});
