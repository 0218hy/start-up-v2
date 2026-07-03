import { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore"; 
import NookletLoading from "../components/nooklet/NookletLoading";
import NookletPage from "../components/nooklet/NookletPage";

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

  if (loading) {
    return <NookletLoading message="Connecting to your world..." />;
  }

  return (
    <NookletPage contentStyle={styles.container}>
      {/* Top Header Back Button Bar Layout */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace("/lobby")}
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
          <Text style={styles.submitButtonText}>Connect to Environment</Text>
        </TouchableOpacity>
      </View>
    </NookletPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    width: "100%",
    marginTop: 8,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#9A3412",
    fontSize: 15,
    fontWeight: "600",
  },
  contentBlock: {
    flex: 1,
    justifyContent: "center",
    marginTop: -60, // Visually offsets form down against top bar boundary
  },
  mainHeading: {
    color: "#431407",
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "SuperJoyful",
    letterSpacing: -0.5,
  },
  subHeading: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  textInputField: {
    height: 54,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 16,
    color: "#431407",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
    shadowColor: "#7C2D12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButton: {
    height: 52,
    backgroundColor: "#EA580C",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#9A3412",
    shadowColor: "#9A3412",
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
    fontFamily: "SuperJoyful",
  },
});
