const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 💡 Explicitly add your 3D asset extensions so Metro can bundle them!
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'glb', 'gltf', 'png', 'jpg'];

module.exports = config;
