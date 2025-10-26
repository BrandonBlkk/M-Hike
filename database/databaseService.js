import AsyncStorage from '@react-native-async-storage/async-storage';

const HIKES_KEY = 'hikes_data';

export const databaseService = {
  // Save a new hike
  saveHike: async (hikeData) => {
    try {
      const existingHikes = await databaseService.getAllHikes();
      const newHike = {
        id: Date.now().toString(),
        ...hikeData,
        created_at: new Date().toISOString()
      };
      
      const updatedHikes = [newHike, ...existingHikes];
      await AsyncStorage.setItem(HIKES_KEY, JSON.stringify(updatedHikes));
      
      return { success: true, id: newHike.id };
    } catch (error) {
      console.error('Error saving hike:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all hikes
  getAllHikes: async () => {
    try {
      const hikesJson = await AsyncStorage.getItem(HIKES_KEY);
      if (hikesJson) {
        const hikes = JSON.parse(hikesJson);
        // Convert date strings to Date objects
        return hikes.map(hike => ({
          ...hike,
          date: new Date(hike.date),
          created_at: new Date(hike.created_at),
          photos: hike.photos || [],
          locationCoords: hike.locationCoords || null
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading hikes:', error);
      return [];
    }
  },

  // Update a hike
  updateHike: async (id, hikeData) => {
    try {
      const existingHikes = await databaseService.getAllHikes();
      const updatedHikes = existingHikes.map(hike => {
        if (hike.id === id) {
          return {
            ...hike,
            ...hikeData,
            id: id,
            created_at: hike.created_at,
            photos: hikeData.photos || hike.photos || [],
            locationCoords: hikeData.locationCoords || hike.locationCoords || null
          };
        }
        return hike;
      });
      
      await AsyncStorage.setItem(HIKES_KEY, JSON.stringify(updatedHikes));
      return { success: true };
    } catch (error) {
      console.error('Error updating hike:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a hike
  deleteHike: async (id) => {
    try {
      const existingHikes = await databaseService.getAllHikes();
      const updatedHikes = existingHikes.filter(hike => hike.id !== id);
      await AsyncStorage.setItem(HIKES_KEY, JSON.stringify(updatedHikes));
      return { success: true };
    } catch (error) {
      console.error('Error deleting hike:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear all hikes
  clearAllHikes: async () => {
    try {
      await AsyncStorage.removeItem(HIKES_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing hikes:', error);
      return { success: false, error: error.message };
    }
  }
};