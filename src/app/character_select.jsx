import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NookletLoading from "../components/nooklet/NookletLoading";
import NookletPage from "../components/nooklet/NookletPage";
import { useAuthStore } from "../stores/authStore";
import { useCharacterStore } from "../stores/characterStore";
import { CHARACTER_CHOICES, characterStorageKey } from "../utils/characterSelection";

export default function CharacterSelectPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setHasCharacter = useCharacterStore((state) => state.setHasCharacter);
  const setStoredCharacterId = useCharacterStore((state) => state.setSelectedCharacterId);
  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTER_CHOICES[0].id);
  const [saving, setSaving] = useState(false);

  const saveCharacter = async () => {
    if (!user?.id) {
      Alert.alert("Session Error", "Please log in before selecting a character.");
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem(characterStorageKey(user.id), selectedCharacterId);
      setHasCharacter(true);
      setStoredCharacterId(selectedCharacterId);
      router.replace("/lobby");
    } catch (error) {
      Alert.alert("Character Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return <NookletLoading message="Preparing your character..." />;
  }

  return (
    <NookletPage scroll contentStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.mainHeading}>Choose Your Character</Text>
        <Text style={styles.subHeading}>
          Pick a placeholder for now. Later, each card can point to a finished sprite sheet.
        </Text>
      </View>

      <View style={styles.characterGrid}>
        {CHARACTER_CHOICES.map((character) => {
          const selected = selectedCharacterId === character.id;

          return (
            <TouchableOpacity
              key={character.id}
              activeOpacity={0.85}
              style={[styles.characterCard, selected && styles.selectedCard]}
              onPress={() => setSelectedCharacterId(character.id)}
            >
              <View style={[styles.placeholderAvatar, { backgroundColor: character.color }]}>
                <Text style={[styles.placeholderInitial, { color: character.accent }]}>
                  {character.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={styles.characterDescription}>{character.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.confirmButton} onPress={saveCharacter}>
        <Text style={styles.confirmText}>Enter Nooklet</Text>
      </TouchableOpacity>
    </NookletPage>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 38,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 26,
  },
  mainHeading: {
    fontFamily: "SuperJoyful",
    fontSize: 34,
    color: "#431407",
    textAlign: "center",
    textShadowColor: "rgba(251, 191, 36, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subHeading: {
    color: "#9A3412",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 10,
  },
  characterGrid: {
    gap: 14,
  },
  characterCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(253, 186, 116, 0.82)",
    padding: 18,
    alignItems: "center",
  },
  selectedCard: {
    backgroundColor: "#FEF08A",
    borderColor: "#EA580C",
    shadowColor: "#9A3412",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  placeholderAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.82)",
  },
  placeholderInitial: {
    fontFamily: "SuperJoyful",
    fontSize: 48,
  },
  characterName: {
    fontFamily: "SuperJoyful",
    color: "#431407",
    fontSize: 24,
    marginTop: 12,
  },
  characterDescription: {
    color: "#9A3412",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
  },
  confirmButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EA580C",
    borderWidth: 1,
    borderColor: "#9A3412",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#9A3412",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  confirmText: {
    fontFamily: "SuperJoyful",
    color: "#FFFFFF",
    fontSize: 18,
  },
});
