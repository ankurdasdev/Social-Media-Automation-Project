import { pool, queryOne } from "./server/db";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

console.log("=== DIAGNOSTIC SCRIPT START ===");
console.log("Environment DATABASE_URL:", process.env.DATABASE_URL);

async function runTest() {
  console.log("\n[1/2] Testing Postgres Connection...");
  try {
    const res = await queryOne("SELECT email FROM users LIMIT 1");
    console.log("✅ Success! Found user email:", res?.email);
  } catch(e: any) {
    console.error("❌ Postgres Connection Failed!");
    console.error(e.message);
    if (e.stack) console.error(e.stack);
  }

  console.log("\n[2/2] Testing Ethereal Email Account Creation...");
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("✅ Nodemailer created test account:", testAccount.user);
    console.log("✅ nodemailer test account pass:", testAccount.pass);
  } catch(e: any) {
    console.error("❌ Nodemailer Creation Failed!");
    console.error(e.message);
    if (e.stack) console.error(e.stack);
  }
  
  console.log("=== DIAGNOSTIC SCRIPT END ===");
  process.exit(0);
}

runTest();
