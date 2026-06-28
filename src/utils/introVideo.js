import { createVideoPlayer } from 'expo-video';

const videoSource = require("../assets/videos/intro_loading.mp4");

export const introVideoPlayer = createVideoPlayer(videoSource);

introVideoPlayer.loop = false;
introVideoPlayer.preload = "auto";
