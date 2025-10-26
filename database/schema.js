export const createTables = (db) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS hikes (
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
        );`,
        [],
        () => {
          console.log('Hikes table created successfully');
          resolve();
        },
        (_, error) => {
          console.log('Error creating table:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};