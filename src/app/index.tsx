// src/app/index.tsx
import { ActivityIndicator, View } from "react-native";

export default function IndexPage() {
  // This acts as a loading splash screen while your _layout.tsx middleware checks Supabase auth
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}
