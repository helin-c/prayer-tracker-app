// src/utils/imagePreloader.js
import { Asset } from 'expo-asset';
import { Image } from 'react-native';

export const preloadImages = async () => {
  const images = [
    require('../assets/images/illustrations/background.png'),
    require('../assets/images/illustrations/background.jpeg')
    // Diğer resimleri de ekleyin
  ];

  const cacheImages = images.map(image => {
    return Asset.fromModule(image).downloadAsync();
  });

  return Promise.all(cacheImages);
};