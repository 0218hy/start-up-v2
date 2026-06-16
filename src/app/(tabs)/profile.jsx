import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Profile Card Header Banner Component */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.largeAvatarCircle}>
          <Text style={styles.largeAvatarText}>👤</Text>
        </View>
        <Text style={styles.usernameText}>
          {profile?.username || "Username"}
        </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeaderCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  largeAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  largeAvatarText: {
    fontSize: 36,
  },
  usernameText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  metaText: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeading: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsGroup: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 16,
  },
  settingRow: {
    height: 54, // Comfortable tap/read sizing
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  settingLabel: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "500",
  },
  settingValue: {
    color: "#64748b",
    fontSize: 14,
    maxWidth: 160,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    height: 52, // Easy tap button profile standard
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
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