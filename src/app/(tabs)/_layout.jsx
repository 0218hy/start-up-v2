import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native"; 

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: "#38bdf8", 
        tabBarInactiveTintColor: "#9ca3af", 
        tabBarStyle: {
          backgroundColor: "#111827", 
          borderTopWidth: 1,
          borderTopColor: "#1f2937", 
        },
      }}
    >
      {/* 1. HOME LOBBY TAB */}
      <Tabs.Screen
        name="lobby"
        options={{
          title: "Home",
          tabBarIcon: () => <Text style={styles.icon}>👤</Text>, 
        }}
      />

      {/* 2. CHAT HUB INBOX TAB */}
      <Tabs.Screen
        name="chatlist"
        options={{
          title: "Messages",
          tabBarIcon: () => <Text style={styles.icon}>💬</Text>, 
        }}
      />

      {/* 3. PLAYER PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <Text style={styles.icon}>⚙️</Text>,
        }}
      /> 
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
  },
});