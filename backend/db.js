const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'weatherdesk.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    observed_date TEXT NOT NULL,
    max_temp REAL,
    max_change REAL,
    max_departure REAL,
    min_temp REAL,
    min_change REAL,
    min_departure REAL,
    humidity_morning REAL,
    humidity_evening REAL,
    rainfall_24h REAL,
    rainfall_9h REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city, region, observed_date)
  );

  CREATE INDEX IF NOT EXISTS idx_obs_region_date ON observations(region, observed_date);
  CREATE INDEX IF NOT EXISTS idx_obs_city_date ON observations(city, observed_date);
`);

/**
 * Upsert an array of observation records.
 * @param {string} region - Region name
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Array} observations - Array of city observation data objects
 * @returns {number} Number of records inserted/updated
 */
const saveObservations = (region, date, observations) => {
  const insert = db.prepare(`
    INSERT INTO observations (
      city, region, observed_date,
      max_temp, max_change, max_departure,
      min_temp, min_change, min_departure,
      humidity_morning, humidity_evening,
      rainfall_24h, rainfall_9h
    )
    VALUES (
      @city, @region, @observed_date,
      @max_temp, @max_change, @max_departure,
      @min_temp, @min_change, @min_departure,
      @humidity_morning, @humidity_evening,
      @rainfall_24h, @rainfall_9h
    )
    ON CONFLICT(city, region, observed_date) DO UPDATE SET
      max_temp = excluded.max_temp,
      max_change = excluded.max_change,
      max_departure = excluded.max_departure,
      min_temp = excluded.min_temp,
      min_change = excluded.min_change,
      min_departure = excluded.min_departure,
      humidity_morning = excluded.humidity_morning,
      humidity_evening = excluded.humidity_evening,
      rainfall_24h = excluded.rainfall_24h,
      rainfall_9h = excluded.rainfall_9h
  `);

  let count = 0;
  const insertMany = db.transaction((obsList) => {
    for (const obs of obsList) {
      // Map API object to DB schema
      const result = insert.run({
        city: obs.city,
        region: region,
        observed_date: date,
        max_temp: obs.temperature?.max ?? null,
        max_change: obs.temperature?.maxChange ?? null,
        max_departure: obs.temperature?.maxDeparture ?? null,
        min_temp: obs.temperature?.min ?? null,
        min_change: obs.temperature?.minChange ?? null,
        min_departure: obs.temperature?.minDeparture ?? null,
        humidity_morning: obs.humidity?.morning ?? null,
        humidity_evening: obs.humidity?.evening ?? null,
        rainfall_24h: obs.rainfall?.last24h ?? null,
        rainfall_9h: obs.rainfall?.last9h ?? null
      });
      if (result.changes > 0) count++;
    }
  });

  insertMany(observations);
  return count;
};

/**
 * Retrieve observations history.
 * @param {Object} query - { region, city, from, to }
 * @returns {Array} List of observations
 */
const getHistory = ({ region, city, from, to }) => {
  let sql = 'SELECT * FROM observations WHERE 1=1';
  const params = {};

  if (region) {
    sql += ' AND region = @region';
    params.region = region;
  }
  
  if (city) {
    sql += ' AND city = @city';
    params.city = city;
  }

  if (from) {
    sql += ' AND observed_date >= @from';
    params.from = from;
  }

  if (to) {
    sql += ' AND observed_date <= @to';
    params.to = to;
  }

  sql += ' ORDER BY observed_date DESC, city ASC';

  const stmt = db.prepare(sql);
  return stmt.all(params);
};

module.exports = {
  db,
  saveObservations,
  getHistory
};
