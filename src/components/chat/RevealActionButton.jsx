import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export default function RevealActionButton({ worldId, isRevealed, onRevealSuccess, onOpenModalRequest }) {
  const [isLocked, setIsLocked] = useState(true);
  const [timeRemainingText, setTimeRemainingText] = useState("Loading...");

  useEffect(() => {
    if (!worldId) return;

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 5000);
    return () => clearInterval(interval);
  }, [worldId]);

  async function checkLockStatus() {
    try {
      const { data: state } = await supabase
        .from("world_chat_states")
        .select("chat_started_at", "days_before_reveal")
        .eq("world_id", worldId)
        .maybeSingle();

      if (state) {
        let cleanString = String(state.chat_started_at).trim().replace(" ", "T");
        if (cleanString.endsWith("+00")) {
          cleanString = cleanString.slice(0, -3) + "Z";
        }

        let startedAt = new Date(cleanString).getTime();
        if (isNaN(startedAt)) {
          startedAt = Date.parse(cleanString) || new Date().getTime();
        }

        const durationMs = (Number(state.days_before_reveal) || 1) * 24 * 60 * 60 * 1000;
        const revealTime = startedAt + durationMs;
        const now = new Date().getTime();

        if (now >= revealTime) {
          setIsLocked(false);
          setTimeRemainingText("");
        } else {
          setIsLocked(true);
          const remainingMs = revealTime - now;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            setTimeRemainingText(`${hours}h ${minutes}m`);
          } else {
            setTimeRemainingText(`${minutes}m`);
          }
        }
      }
    } catch (err) {
      setTimeRemainingText("Error");
    }
  }

  function handlePress() {
    // 🌟 Shortcut: If already revealed globally, treat button as an anchor to re-open the modal
    if (isRevealed) {
      if (onOpenModalRequest) onOpenModalRequest();
      return;
    }

    if (isLocked) {
      return Alert.alert(
        "⏳ Loop Still Weaving",
        `Please wait another ${timeRemainingText} before revealing identities.`
      );
    }

    if (onRevealSuccess) onRevealSuccess();
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.btnBase, 
        isRevealed ? styles.btnRevealed : (isLocked ? styles.btnLocked : styles.btnUnlocked)
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.textBase, isLocked && !isRevealed ? styles.textLocked : styles.textUnlocked]}>
        {isRevealed ? "📢 View" : (isLocked ? `🔒 ${timeRemainingText}` : "📢 Reveal!")}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnBase: { 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    minWidth: 80, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  btnLocked: { 
    backgroundColor: "#E2E8F0", 
    borderColor: "#CBD5E1" 
  },
  btnUnlocked: { 
    backgroundColor: "#EF4444", 
    borderColor: "#991B1B" 
  },
  btnRevealed: { 
    backgroundColor: "#F59E0B", 
    borderColor: "#B45309" 
  },
  textBase: { 
    fontSize: 11, 
    fontWeight: "700" 
  },
  textLocked: { 
    color: "#64748B" 
  },
  textUnlocked: { 
    color: "#FFFFFF" 
  }
});