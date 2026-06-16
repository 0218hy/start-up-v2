import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    async function fetchUserChats() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("world_members")
          .select(`
            world_id,
            worlds (id, world_name)
          `)
          .eq("player_id", user.id);

        if (error) throw error;
        setChats(data || []);
      } catch (err) {
        console.error("Error loading chat items:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserChats();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#94a3b8" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.mainHeading}>Your Private Channels</Text>
        <Text style={styles.subHeading}>Select a secure workspace to view active communications.</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.world_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>No active chats found.</Text>
            <Text style={styles.emptySubText}>Join or create a space to establish messaging channels.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (!item.worlds) return null;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.chatCard}
              onPress={() => router.push(`/chat/${item.worlds.id}`)}
            >
              <View style={styles.chatInfo}>
                <Text style={styles.worldName}>{item.worlds.world_name}</Text>
                <Text style={styles.chatPreview}>Open secure channel</Text>
              </View>
              
              <View style={styles.arrowIndicator}>
                <Text style={styles.arrowText}>➔</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Muted modern off-white to match lobby
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  chatCard: {
    height: 72, // Matches the identical visual height profile of WorldCard
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  worldName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  chatPreview: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  arrowIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  arrowText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyBlock: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubText: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});