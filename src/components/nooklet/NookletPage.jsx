import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const flowerTopLeft = require("../../assets/images/nooklet/flower1.png");

export default function NookletPage({ children, scroll = false, edges = ["top", "bottom"], contentStyle }) {
  const Content = scroll ? ScrollView : View;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFEDD5", "#FED7AA", "#FEE2E2"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <Image source={flowerTopLeft} style={styles.flowerAccent} resizeMode="contain" />
      <SafeAreaView edges={edges} style={styles.safeArea}>
        <Content
          style={!scroll ? [styles.content, contentStyle] : undefined}
          contentContainerStyle={scroll ? [styles.scrollContent, contentStyle] : undefined}
        >
          {children}
        </Content>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  flowerAccent: {
    position: "absolute",
    top: 8,
    left: -56,
    width: 190,
    height: 190,
    opacity: 0.9,
  },
});
