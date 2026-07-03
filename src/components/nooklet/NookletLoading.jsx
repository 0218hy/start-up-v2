import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, Text, View } from "react-native";
import { loadingVideoSource } from "../../utils/introVideo";

export default function NookletLoading({ message = "Loading Nooklet..." }) {
  const loadingVideoPlayer = useVideoPlayer(loadingVideoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.volume = 0;
    player.play();
  });

  return (
    <View style={styles.container}>
      <View style={styles.videoFrame}>
        <VideoView
          player={loadingVideoPlayer}
          style={styles.video}
          nativeControls={false}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          playsInline
        />
      </View>
      <View style={styles.scrim} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  videoFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(67, 20, 7, 0.24)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textShadowColor: "rgba(67, 20, 7, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
