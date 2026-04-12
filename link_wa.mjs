import pg from "pg";
const { Pool } = pg;
const pool = new Pool({
  connectionString: "postgresql://postgres:b5e9209b350e6a97f7d6@localhost:5433/SocialOutreach"
});
async function run() {
  try {
    const res = await pool.query("SELECT id, email FROM users;");
    console.log("Users:", res.rows);
    if (res.rows.length > 0) {
      const email = "ankmuz007@gmail.com"; // Expected user email
      const user = res.rows.find(r => r.email === email) || res.rows[0];
      await pool.query(`
        INSERT INTO whatsapp_instances (user_id, instance_name) 
        VALUES ($1, $2) 
        ON CONFLICT (user_id) DO UPDATE SET instance_name = $2
      `, [user.id, 'Evolution1']);
      console.log("Linked Evolution1 to", user.email);
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
