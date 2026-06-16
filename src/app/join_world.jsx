import { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Fonts, Spacing } from "../constants/theme"; // Adjust path to your theme.js

export default function JoinWorld() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  async function join() {
    if (!code.trim()) {
      return Alert.alert("Validation", "Please enter a space code to proceed.");
    }
    if (!user) {
      return Alert.alert("Session Error", "You must be signed in to join an environment.");
    }

    setLoading(true);

    try {
      const { data: world, error: worldError } = await supabase
        .from("worlds")
        .select("id")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle();

      if (worldError) throw worldError;

      if (!world) {
        setLoading(false);
        return Alert.alert("Not Found", "We couldn't find an active environment matching that code.");
      }

      const { data: existingMember, error: memberCheckError } = await supabase
        .from("world_members")
        .select("world_id")
        .eq("world_id", world.id)
        .eq("player_id", user.id)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;

      if (existingMember) {
        setLoading(false);
        router.push(`/world/${world.id}`);
        return;
      }

      const { error: insertError } = await supabase
        .from("world_members")
        .insert({
          world_id: world.id,
          player_id: user.id,
          role: "member",
        });

      if (insertError) throw insertError;
      router.push(`/world/${world.id}`);

    } catch (error) {
      Alert.alert("Connection Issue", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Top Header Back Button Bar Layout */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Lobby</Text>
        </TouchableOpacity>
      </View>

      {/* Main Focus Form Content Area */}
      <View style={styles.contentBlock}>
        <Text style={styles.mainHeading}>Enter a Shared Space</Text>
        <Text style={styles.subHeading}>Type in the unique security code given to you by your partner or guide.</Text>

        <TextInput
          placeholder="e.g. SKY-AURORA-9"
          placeholderTextColor="#94a3b8"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          editable={!loading}
          style={styles.textInputField}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={join}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Connect to Environment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background, // #fcfaff Lavender-Cream
  },
  headerBar: {
    width: "100%",
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: Colors.light.textSecondary, // #6366f1 Indigo Accent
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: "600",
  },
  contentBlock: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    marginTop: -60, // Visually offsets form down against top bar boundary
  },
  mainHeading: {
    color: Colors.light.text, // #1e1b4b Deep indigo
    fontSize: 26,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
    letterSpacing: -0.5,
  },
  subHeading: {
    color: "#64748b",
    fontSize: 14,
    fontFamily: Fonts.rounded,
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  textInputField: {
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement, // #f3e8ff Soft Purple
    paddingHorizontal: Spacing.three,
    color: Colors.light.text,
    fontSize: 16,
    fontFamily: Fonts.rounded,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.three,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButton: {
    height: 52,
    backgroundColor: Colors.light.accent, // #34d399 Healing Mint Green
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
});