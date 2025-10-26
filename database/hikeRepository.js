import { getDatabase } from './index';

export const hikeRepository = {
  createHike: (hikeData) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDatabase();
        
        db.runAsync(
          `INSERT INTO hikes (
            name, location, date, parking, length, difficulty, 
            description, notes, weather
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hikeData.name,
            hikeData.location,
            hikeData.date.toISOString(),
            hikeData.parking,
            parseFloat(hikeData.length),
            hikeData.difficulty,
            hikeData.description || '',
            hikeData.notes || '',
            hikeData.weather || ''
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
            date: new Date(row.date)
          }));
          resolve({ success: true, hikes });
        }).catch(error => {
          reject({ success: false, error: error.message });
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }
};