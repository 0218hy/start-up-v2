import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useCharacterStore } from "../../stores/characterStore";
import { CHARACTER_CHOICES, characterStorageKey, getCharacterById } from "../../utils/characterSelection";
import NookletLoading from "../../components/nooklet/NookletLoading";
import NookletPage from "../../components/nooklet/NookletPage";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const selectedCharacterId = useCharacterStore((state) => state.selectedCharacterId);
  const setSelectedCharacterId = useCharacterStore((state) => state.setSelectedCharacterId);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCharacterId, setSavingCharacterId] = useState(null);
  const selectedCharacter = getCharacterById(selectedCharacterId);

  useEffect(() => {
    if (!user) return;

    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile details:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      Alert.alert("Sign Out Failed", err.message);
    }
  };

  const handleCharacterChange = async (characterId) => {
    if (!user?.id || characterId === selectedCharacterId) return;

    try {
      setSavingCharacterId(characterId);
      await AsyncStorage.setItem(characterStorageKey(user.id), characterId);
      setSelectedCharacterId(characterId);
    } catch (err) {
      Alert.alert("Character Error", err.message);
    } finally {
      setSavingCharacterId(null);
    }
  };

  if (loading) {
    return <NookletLoading message="Loading your profile..." />;
  }

  return (
    <NookletPage scroll contentStyle={styles.container}>
      {/* Profile Card Header Banner Component */}
      <View style={styles.profileHeaderCard}>
        <View style={[styles.largeAvatarCircle, { backgroundColor: selectedCharacter.color }]}>
          <Text style={[styles.largeAvatarText, { color: selectedCharacter.accent }]}>
            {selectedCharacter.name.charAt(0)}
          </Text>
        </View>
        <Text style={styles.usernameText}>
          {profile?.username || "Username"}
        </Text>
        <Text style={styles.characterNameText}>{selectedCharacter.name}</Text>
      </View>

      <Text style={styles.sectionHeading}>Character</Text>
      <View style={styles.characterGroup}>
        {CHARACTER_CHOICES.map((character) => {
          const selected = selectedCharacterId === character.id;
          const saving = savingCharacterId === character.id;

          return (
            <TouchableOpacity
              key={character.id}
              activeOpacity={0.85}
              style={[styles.characterChoice, selected && styles.selectedCharacterChoice]}
              onPress={() => handleCharacterChange(character.id)}
              disabled={Boolean(savingCharacterId)}
            >
              <View style={[styles.characterDot, { backgroundColor: character.color }]}>
                <Text style={[styles.characterInitial, { color: character.accent }]}>
                  {character.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.characterTextBlock}>
                <Text style={styles.characterChoiceName}>{character.name}</Text>
                <Text style={styles.characterChoiceMeta}>
                  {saving ? "Saving..." : selected ? "Selected" : "Tap to switch"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account configurations list section */}
      <Text style={styles.sectionHeading}>Profile</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>User Identifier</Text>
          <Text style={styles.settingValue} numberOfLines={1}>
            {user?.id?.substring(0, 12)}...
          </Text>
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingLabel}>Network Security</Text>
          <Text style={[styles.settingValue, { color: "#22c55e" }]}>Encrypted</Text>
        </View>
      </View>

      {/* Sign Out Action Touch Control Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.logoutButtonText}>Disconnect Session</Text>
      </TouchableOpacity>
    </NookletPage>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  profileHeaderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  largeAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF08A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  largeAvatarText: {
    fontFamily: "SuperJoyful",
    fontSize: 42,
  },
  usernameText: {
    fontFamily: "SuperJoyful",
    color: "#431407",
    fontSize: 22,
    fontWeight: "800",
  },
  characterNameText: {
    color: "#9A3412",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  metaText: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeading: {
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 16,
  },
  characterGroup: {
    gap: 10,
  },
  characterChoice: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedCharacterChoice: {
    backgroundColor: "#FEF08A",
    borderColor: "#EA580C",
  },
  characterDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.86)",
    marginRight: 12,
  },
  characterInitial: {
    fontFamily: "SuperJoyful",
    fontSize: 24,
  },
  characterTextBlock: {
    flex: 1,
  },
  characterChoiceName: {
    fontFamily: "SuperJoyful",
    color: "#431407",
    fontSize: 17,
  },
  characterChoiceMeta: {
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  settingRow: {
    height: 54, // Comfortable tap/read sizing
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
  },
  settingLabel: {
    color: "#431407",
    fontSize: 15,
    fontWeight: "500",
  },
  settingValue: {
    color: "#9A3412",
    fontSize: 14,
    maxWidth: 160,
  },
  logoutButton: {
    backgroundColor: "#EA580C",
    height: 52, // Easy tap button profile standard
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
});
