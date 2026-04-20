import { queryOne } from "./server/db/index";

async function check() {
  try {
    const row = await queryOne("SELECT automation_comment, status FROM contacts WHERE name = 'Regression Success' LIMIT 1");
    console.log("STATUS:", row?.status);
    console.log("COMMENT:", row?.automation_comment);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
