// src/utils/imagePreloader.js (UPDATED)
import { Asset } from 'expo-asset';

export const preloadImages = async () => {
  const images = [
    require('../assets/images/illustrations/bg.png'), // ✅ Make sure this matches!
    require('../assets/images/illustrations/background.png'),
    require('../assets/images/illustrations/background.jpeg'),
    // Add any other images used in your app
  ];

  const cacheImages = images.map(image => {
    return Asset.fromModule(image).downloadAsync();
  });

  return Promise.all(cacheImages);
};