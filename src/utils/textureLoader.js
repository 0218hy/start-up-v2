// 📁 src/utils/textureLoader.js
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';

export async function loadUniversalTexture(moduleRequire) {
  // 1. Core verification path safety fallback
  if (!moduleRequire) return null;

  const asset = Asset.fromModule(moduleRequire);
  await asset.downloadAsync();

  // 🚀 FIXED: Fallback safety checklist to catch strict web string conversions
  let assetUrl = asset.localUri || asset.uri;
  if (!assetUrl && typeof moduleRequire === 'string') {
    assetUrl = moduleRequire;
  }

  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = assetUrl;

      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.flipY = false;
        texture.needsUpdate = true;
        resolve(texture);
      };
      img.onerror = (err) => reject(new Error(`Failed to decode web texture source: ${assetUrl}`));
    } else {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        assetUrl,
        (texture) => {
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          texture.flipY = false;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        (err) => reject(err)
      );
    }
  });
}
