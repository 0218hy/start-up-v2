import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
// 1. Import your central store context
import { useAuthStore } from "@/stores/authStore";

export default function CreateWorld() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 2. Grab your logged-in user context instantly from memory
  const user = useAuthStore((state) => state.user);

  // Helper utility function to generate a random room code string
  function generateRandomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function create() {
    if (!name.trim()) {
      return Alert.alert("Error", "Please provide a valid name for your world.");
    }
    if (!user) {
      return Alert.alert("Error", "You must be logged in to create a world.");
    }

    setLoading(true);

    try {
      let code = generateRandomCode();
      let isUnique = false;
      let retries = 0;

      // 3. Collision Prevention: Loop a few times if the randomly generated code already exists
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

      // 4. Insert the new world configuration data row safely
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

      // 5. Link the owner profile into the sub-relational membership group table 
      const { error: memberError } = await supabase
        .from("world_members")
        .insert({
          world_id: world.id,
          player_id: user.id,
          role: "owner", // Assumes your database accepts a role column context string
        });

      if (memberError) throw memberError;

      // 6. Fast-forward player directly into their new game world routing canvas
      router.push(`/world/${world.id}`);

    } catch (error: any) {
      Alert.alert("Error Creating World", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 20, justifyContent: 'center', flex: 1, backgroundColor: '#111' }}>
      <TextInput
        placeholder="World Name"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        style={{ 
          borderBottomWidth: 1, 
          borderColor: '#444', 
          color: '#fff', 
          marginBottom: 25, 
          padding: 8,
          fontSize: 18
        }}
      />

      <Button
        title={loading ? "Creating..." : "Create World"}
        onPress={create}
        disabled={loading}
        color="#38bdf8"
      />
    </View>
  );
}
