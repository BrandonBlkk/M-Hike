import { getDatabase } from './index';

export const hikeRepository = {
  // Create a new hike
  createHike: (hikeData) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `INSERT INTO hikes (
            name, location, date, parking, length, route_type, difficulty, 
            description, notes, weather, photos, locationCoords, is_completed, completed_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hikeData.name,
            hikeData.location,
            hikeData.date.toISOString(),
            hikeData.parking,
            parseFloat(hikeData.length),
            hikeData.route_type || '',
            hikeData.difficulty,
            hikeData.description || '',
            hikeData.notes || '',
            hikeData.weather || '',
            JSON.stringify(hikeData.photos || []), // Store photos as JSON string
            hikeData.locationCoords ? JSON.stringify(hikeData.locationCoords) : null, // Store coords as JSON string
            hikeData.is_completed || 0,
            hikeData.completed_date ? hikeData.completed_date.toISOString() : null
          ]
        ).then(result => {
          resolve({ success: true, id: result.lastInsertRowId.toString() });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  // Get all hikes
  getAllHikes: () => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.getAllAsync(
          `SELECT * FROM hikes ORDER BY date DESC, created_at DESC`
        ).then(rows => {
          const hikes = rows.map(row => ({
            id: row.id.toString(),
            name: row.name,
            location: row.location,
            date: new Date(row.date),
            parking: row.parking,
            length: row.length,
            route_type: row.route_type || '',
            difficulty: row.difficulty,
            description: row.description || '',
            notes: row.notes || '',
            weather: row.weather || '',
            photos: row.photos ? JSON.parse(row.photos) : [], // Parse photos JSON
            locationCoords: row.locationCoords ? JSON.parse(row.locationCoords) : null, // Parse coords JSON
            is_completed: row.is_completed || 0,
            completed_date: row.completed_date ? new Date(row.completed_date) : null,
            created_at: new Date(row.created_at)
          }));
          resolve({ success: true, hikes });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  // Get a single hike by ID
  getHikeById: (id) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.getFirstAsync(
          `SELECT * FROM hikes WHERE id = ?`,
          [id]
        ).then(row => {
          if (row) {
            const hike = {
              id: row.id.toString(),
              name: row.name,
              location: row.location,
              date: new Date(row.date),
              parking: row.parking,
              length: row.length,
              route_type: row.route_type || '',
              difficulty: row.difficulty,
              description: row.description || '',
              notes: row.notes || '',
              weather: row.weather || '',
              photos: row.photos ? JSON.parse(row.photos) : [],
              locationCoords: row.locationCoords ? JSON.parse(row.locationCoords) : null,
              is_completed: row.is_completed || 0,
              completed_date: row.completed_date ? new Date(row.completed_date) : null,
              created_at: new Date(row.created_at)
            };
            resolve({ success: true, hike });
          } else {
            resolve({ success: false, error: 'Hike not found' });
          }
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  // Update a hike
  updateHike: (id, hikeData) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `UPDATE hikes SET 
            name = ?, location = ?, date = ?, parking = ?, length = ?, 
            route_type = ?, difficulty = ?, description = ?, notes = ?, 
            weather = ?, photos = ?, locationCoords = ?, is_completed = ?, completed_date = ?
          WHERE id = ?`,
          [
            hikeData.name,
            hikeData.location,
            hikeData.date.toISOString(),
            hikeData.parking,
            parseFloat(hikeData.length),
            hikeData.route_type || '',
            hikeData.difficulty,
            hikeData.description || '',
            hikeData.notes || '',
            hikeData.weather || '',
            JSON.stringify(hikeData.photos || []),
            hikeData.locationCoords ? JSON.stringify(hikeData.locationCoords) : null,
            hikeData.is_completed || 0,
            hikeData.completed_date ? hikeData.completed_date.toISOString() : null,
            id
          ]
        ).then(result => {
          if (result.changes > 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Hike not found' });
          }
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  // Delete a hike
  deleteHike: (id) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `DELETE FROM hikes WHERE id = ?`,
          [id]
        ).then(result => {
          if (result.changes > 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Hike not found' });
          }
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  // Clear all hikes
  clearAllHikes: () => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(`DELETE FROM hikes`)
          .then(result => {
            resolve({ success: true });
          })
          .catch(error => {
            reject({ success: false, error: error.message });
          });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }
};