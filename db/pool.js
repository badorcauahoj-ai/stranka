const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL není nastavená - appka poběží, ale žádné dotazy do DB nebudou fungovat.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway Postgres vyžaduje SSL, ale s self-signed certifikátem -
  // rejectUnauthorized: false je běžné nastavení pro managed Postgres.
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initSchema() {
  if (!process.env.DATABASE_URL) return;
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Databázové schéma je připravené.');
}

module.exports = { pool, initSchema };
