import { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { persistInitialWorldTiles } from "../utils/worldTileSeed";
import NookletLoading from "../components/nooklet/NookletLoading";
import NookletPage from "../components/nooklet/NookletPage";

export default function CreateWorld() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  function generateRandomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function create() {
    if (!name.trim()) {
      return Alert.alert("Validation", "Please provide a valid name for your new space.");
    }
    if (!user) {
      return Alert.alert("Session Error", "You must be logged in to build an environment.");
    }

    setLoading(true);

    try {
      let code = generateRandomCode();
      let isUnique = false;
      let retries = 0;

      while (!isUnique && retries < 5) {
        const { data: codeCheck } = await supabase
          .from("worlds")
          .select("code")
          .eq("code", code)
          .maybeSingle();

        if (!codeCheck) {
          isUnique = true;
        } else {
          code = generateRandomCode();
          retries++;
        }
      }

      const { data: world, error: worldError } = await supabase
        .from("worlds")
        .insert({
          world_name: name.trim(),
          owner_id: user.id,
          code,
        })
        .select()
        .single();

      if (worldError) throw worldError;
      if (!world) throw new Error("World creation returned empty data parameters.");

      const { error: memberError } = await supabase
        .from("world_members")
        .insert({
          world_id: world.id,
          player_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      await persistInitialWorldTiles(supabase, world.id);

      router.replace(`/world/${world.id}`);

    } catch (error) {
      Alert.alert("Creation Issue", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <NookletLoading message="Creating your world..." />;
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
          <Text style={styles.backButtonText}>← Back to Lounge</Text>
        </TouchableOpacity>
      </View>

      {/* Main Focus Form Content Area */}
      <View style={styles.contentBlock}>
        <Text style={styles.mainHeading}>Manifest a New Space</Text>
        <Text style={styles.subHeading}>Give your environment a calming name. You will receive a secure code to share with your partner.</Text>

        <TextInput
          placeholder="e.g. Dream Canopy"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
          editable={!loading}
          style={styles.textInputField}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={create}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>Create Environment</Text>
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
    marginTop: -60, // Visually centers layout on the screen
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
