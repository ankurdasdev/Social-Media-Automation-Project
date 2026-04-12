const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres:b5e9209b350e6a97f7d6@localhost:5433/SocialOutreach';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function main() {
  try {
    const testEmail = 'testing@test.com';
    const testPassword = 'testing';
    const testName = 'Testing Admin';
    const testId = '00000000-0000-0000-0000-000000000000';

    console.log('Checking for test user...');
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    
    if (res.rows.length === 0) {
      console.log('User not found. Seeding...');
      const hash = await bcrypt.hash(testPassword, 12);
      await pool.query(
        'INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)',
        [testId, testEmail, testName, hash]
      );
      console.log('✅ Seed successful.');
    } else {
      console.log('✅ User already exists.');
    }
  } catch (err) {
    console.error('❌ Error seeding user:', err);
  } finally {
    await pool.end();
  }
}

main();
