const fs = require('fs');
const { createClient } = require('@libsql/client');

require('dotenv').config({ path: '../.dev.vars' });

async function init() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .dev.vars');
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const schema = fs.readFileSync('../schema.sql', 'utf8');

  console.log('Connecting to Turso...');
  
  // Split schema into individual statements
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log('Executed:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
    } catch (e) {
      console.error('Error executing statement:', e.message);
    }
  }

  console.log('Database initialization complete!');
  process.exit(0);
}

init();
