import * as SQLite from 'expo-sqlite';

const databaseName = 'hikeTracker.db';

let db = null;

export const getDatabase = () => {
  if (!db) {
    try {
      db = SQLite.openDatabaseSync(databaseName);
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return db;
};

export const initDatabase = () => {
  try {
    const db = getDatabase();
    
    db.exec([{
      sql: `CREATE TABLE IF NOT EXISTS hikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        parking TEXT NOT NULL,
        length REAL NOT NULL,
        difficulty TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        weather TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    }], false, (_, result) => {
      console.log('Database initialized successfully');
    });
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};