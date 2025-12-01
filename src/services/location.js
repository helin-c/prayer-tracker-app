import * as Location from 'expo-location';

export const locationService = {
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  },

  async getCityCountry(latitude, longitude) {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      return {
        city: address.city || address.subregion,
        country: address.country,
        timezone: address.timezone,
      };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { city: null, country: null, timezone: null };
    }
  },
};
