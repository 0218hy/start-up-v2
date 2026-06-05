import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
// 1. Import your central authentication store
import { useAuthStore } from "@/stores/authStore"; 

export default function JoinWorld() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 2. Grab your logged-in user context instantly from memory
  const user = useAuthStore((state) => state.user);

  async function join() {
    if (!code.trim()) {
      return Alert.alert("Error", "Please enter a world code.");
    }
    if (!user) {
      return Alert.alert("Error", "You must be logged in to join a world.");
    }

    setLoading(true);

    try {
      // 3. Look up the world by its code safely
      const { data: world, error: worldError } = await supabase
        .from("worlds")
        .select("id")
        .eq("code", code.trim())
        .maybeSingle(); // 💡 safe alternative to .single() that won't crash if missing

      if (worldError) throw worldError;

      if (!world) {
        setLoading(false);
        return Alert.alert("Not Found", "No world exists with that matching code.");
      }

      // 4. Check if the player is already a member of this specific world
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("world_members")
        .select("id")
        .eq("world_id", world.id)
        .eq("player_id", user.id)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;

      if (existingMember) {
        // If they are already a member, simply fast-forward them into the game scene!
        setLoading(false);
        router.push(`/world/${world.id}`);
        return;
      }

      // 5. Join the world if they aren't part of it yet
      const { error: insertError } = await supabase
        .from("world_members")
        .insert({
          world_id: world.id,
          player_id: user.id,
        });

      if (insertError) throw insertError;

      // 6. Send them directly into the world environment canvas
      router.push(`/world/${world.id}`);

    } catch (error: any) {
      Alert.alert("Error Joining World", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 20, justifyContent: 'center', flex: 1, backgroundColor: '#111' }}>
      <TextInput
        placeholder="Enter World Code"
        placeholderTextColor="#666"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters" // Codes are typically cleaner when normalized to uppercase
        style={{ 
          borderBottomWidth: 1, 
          borderColor: '#444', 
          color: '#fff', 
          marginBottom: 20, 
          padding: 8,
          fontSize: 18
        }}
      />

      <Button
        title={loading ? "Joining..." : "Join World"}
        onPress={join}
        disabled={loading}
        color="#38bdf8"
      />
    </View>
  );
}
