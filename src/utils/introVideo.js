import { createVideoPlayer } from 'expo-video';

const videoSource = require("../assets/videos/intro_loading.mp4");

export const introVideoPlayer = createVideoPlayer(videoSource, (player) => {
  player.loop = false;
  player.preload = "auto"; // 🚀 Tells the hardware to cache video frames right now
});