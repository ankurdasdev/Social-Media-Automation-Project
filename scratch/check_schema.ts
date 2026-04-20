import { query } from "./server/db/index";

async function checkSchema() {
  try {
    const result = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'source_groups'");
    console.log("COLUMNS:", result.map(r => r.column_name).join(", "));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
