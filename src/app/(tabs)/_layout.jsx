import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

function TabIcon({ label, focused }) {
  return (
    <View style={[styles.iconPill, focused && styles.activeIconPill]}>
      <Text style={[styles.icon, focused && styles.activeIcon]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#431407",
        tabBarInactiveTintColor: "#9A3412",
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: {
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "rgba(255, 255, 255, 0.94)",
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: "#FDBA74",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#9A3412",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 14,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="lobby"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon label="H" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="chatlist"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => <TabIcon label="M" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon label="P" focused={focused} />,
        }}
      /> 
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  iconPill: {
    width: 32,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  activeIconPill: {
    backgroundColor: "#FEF08A",
    borderColor: "#EA580C",
  },
  icon: {
    fontFamily: "SuperJoyful",
    fontSize: 15,
    color: "#9A3412",
  },
  activeIcon: {
    color: "#431407",
  },
});
