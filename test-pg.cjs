const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://ankur:Password123!@46.62.144.244:15432/casthub_prod",
  connectionTimeoutMillis: 5000
});

async function main() {
  try {
    const res = await pool.query("SELECT 1 as test");
    console.log("SUCCESS! Postgres is working:", res.rows[0]);
  } catch (e) {
    console.error("FAIL", e);
  } finally {
    pool.end();
  }
}
main();
