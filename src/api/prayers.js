import api from './backend';

export const prayersAPI = {
  // Get prayer times for a location
  getPrayerTimes: (latitude, longitude, method = 2, school = 0) =>
    api.get('/prayers/times', {
      params: { latitude, longitude, method, school }
    }),
  
  // Save user location
  saveLocation: (data) => api.post('/prayers/location', data),
  
  // Get saved location
  getLocation: () => api.get('/prayers/location'),
};