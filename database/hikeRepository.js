import { getDatabase } from './index';

export const hikeRepository = {
  createHike: (hikeData) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `INSERT INTO hikes (
            name, location, date, parking, length, route_type, difficulty, 
            description, notes, weather, is_completed, completed_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            hikeData.is_completed || 0,
            hikeData.completed_date || null
          ]
        ).then(result => {
          resolve({ success: true, id: result.lastInsertRowId });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  getAllHikes: () => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.getAllAsync(
          `SELECT * FROM hikes ORDER BY date DESC, created_at DESC`
        ).then(rows => {
          const hikes = rows.map(row => ({
            ...row,
            date: new Date(row.date),
            completed_date: row.completed_date ? new Date(row.completed_date) : null
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
  
  updateHike: (id, hikeData) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `UPDATE hikes SET 
            name = ?, location = ?, date = ?, parking = ?, length = ?, 
            route_type = ?, difficulty = ?, description = ?, notes = ?, 
            weather = ?, is_completed = ?, completed_date = ?
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
            hikeData.is_completed || 0,
            hikeData.completed_date || null,
            id
          ]
        ).then(result => {
          resolve({ success: true });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  },
  
  deleteHike: (id) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `DELETE FROM hikes WHERE id = ?`,
          [id]
        ).then(result => {
          resolve({ success: true });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }
};