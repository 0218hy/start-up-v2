import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export default function RevealModal({ visible, worldId, userId, onClose, onResetSuccess }) {
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
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
    Alert.alert(
      "🔄 Reset Loop assignments?",
      "This will wipe out all pairings and clear chat histories entirely for this room.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              await supabase.from("angel_assignments").delete().eq("world_id", worldId);
              await supabase.from("messages").delete().eq("world_id", worldId);
              await supabase.from("world_chat_states").update({
                loop_revealed: false,
                chat_started_at: new Date().toISOString()
              }).eq("world_id", worldId);

              if (onResetSuccess) onResetSuccess();
            } catch (err) {
              console.error(err.message);
            } finally {
              setResetting(false);
            }
          }
        }
      ]
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
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
            </>
          )}
        </View>
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
  resetButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 }
});