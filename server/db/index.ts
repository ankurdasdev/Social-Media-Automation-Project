import { Pool } from "pg";
import bcrypt from "bcryptjs";

// DATABASE_URL format:
// Local dev via SSH tunnel: postgresql://postgres:PASSWORD@localhost:5433/SocialOutreach
// Production (Easypanel internal): postgresql://postgres:PASSWORD@hiker_social_outreach_automation:5432/SocialOutreach?sslmode=disable

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:b5e9209b350e6a97f7d6@hiker_social_outreach_automation:5432/SocialOutreach?sslmode=disable";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function initDb(): Promise<void> {
  const client = await pool.connect().catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err);
    console.warn("⚠️  Falling back to in-memory stores.");
    return null;
  });
  if (!client) return;
  client.release(); // ← Critical: always release the test connection back to the pool
  console.log("✅ PostgreSQL connected");
  await runMigrations();
  await seedTestData();
}

async function seedTestData(): Promise<void> {
  // Guard: Seed if not in production, OR if SEED_TEST_USER is explicitly true
  const isProduction = process.env.NODE_ENV === "production";
  const shouldSeedOverride = process.env.SEED_TEST_USER === "true";

  if (isProduction && !shouldSeedOverride) {
    console.log("ℹ️  Production environment detected. Skipping test user seeding (use SEED_TEST_USER=true to override).");
    return;
  }

  const testEmail = "testing@test.com";
  const testPassword = "testing";
  const testName = "Testing Admin";
  // Fixed UUID for the testing user to ensure consistency across dev restarts
  const testId = "00000000-0000-0000-0000-000000000000";

  try {
    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [testEmail]);
    if (!existing) {
      const passwordHash = await bcrypt.hash(testPassword, 12);
      await query(
        `INSERT INTO users (id, email, name, password_hash) 
         VALUES ($1, $2, $3, $4)`,
        [testId, testEmail, testName, passwordHash]
      );
      console.log("🛠️  Testing admin user seeded: testing@test.com / testing");
    }
  } catch (err) {
    console.error("❌ Failed to seed testing user:", err);
  }
}

async function runMigrations(): Promise<void> {
  // Add new columns safely to existing tables first
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `).catch(() => {}); // Ignore if users table doesn't exist yet — it will be created below

  const sql = `
    -- Users table (for multi-user support)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Google OAuth tokens per user
    CREATE TABLE IF NOT EXISTS google_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT NOT NULL,
      id_token TEXT,
      token_expiry TIMESTAMPTZ,
      drive_folder_id TEXT,
      drive_folder_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- Source groups
    CREATE TABLE IF NOT EXISTS source_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'group',
      platform TEXT NOT NULL DEFAULT 'whatsapp',
      url TEXT,
      description TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      member_count INTEGER,
      last_scraped TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Contacts
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      casting_name TEXT,
      whatsapp TEXT,
      email TEXT,
      insta_handle TEXT,
      acting_context TEXT,
      project TEXT,
      age TEXT,
      sheet_name TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      automation_trigger BOOLEAN DEFAULT FALSE,
      row_color TEXT,
      whatsapp_run BOOLEAN DEFAULT FALSE,
      email_run BOOLEAN DEFAULT FALSE,
      instagram_run BOOLEAN DEFAULT FALSE,
      template_selection_wp TEXT,
      template_selection_gmail TEXT,
      template_selection_ig TEXT,
      salutation_wa TEXT DEFAULT 'Hi',
      salutation_email TEXT DEFAULT 'Hi',
      salutation_ig TEXT DEFAULT 'Hi',
      has_custom_message_wa BOOLEAN DEFAULT FALSE,
      editable_message_wp TEXT,
      has_custom_message_email BOOLEAN DEFAULT FALSE,
      editable_message_gmail TEXT,
      editable_gmail_subject TEXT,
      has_custom_message_ig BOOLEAN DEFAULT FALSE,
      editable_message_ig TEXT,
      special_attachment_wa TEXT,
      special_attachment_gmail TEXT,
      special_attachment_ig TEXT,
      -- Drive attachment IDs (JSON arrays)
      drive_attachments_wa JSONB DEFAULT '[]',
      drive_attachments_email JSONB DEFAULT '[]',
      drive_attachments_ig JSONB DEFAULT '[]',
      notes TEXT,
      source TEXT DEFAULT 'manual',
      follow_ups INTEGER DEFAULT 0,
      contacted_dates JSONB DEFAULT '[]',
      last_contacted TEXT,
      automation_comment TEXT,
      contact_links JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Templates
    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('whatsapp', 'email', 'instagram')),
      content TEXT DEFAULT '',
      is_attachment BOOLEAN DEFAULT FALSE,
      attachment_url TEXT,
      attachment_detail_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- WhatsApp instances per user
    CREATE TABLE IF NOT EXISTS whatsapp_instances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      instance_name TEXT NOT NULL,
      status TEXT DEFAULT 'disconnected',
      phone_number TEXT,
      connected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Instagram sessions per user
    CREATE TABLE IF NOT EXISTS instagram_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      username TEXT,
      session_data TEXT,
      status TEXT DEFAULT 'disconnected',
      connected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_sheet ON contacts(sheet_name);
    CREATE INDEX IF NOT EXISTS idx_templates_user_category ON templates(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_groups_user_platform ON source_groups(user_id, platform);
  `;

  await query(sql);
  console.log("✅ Database migrations applied");
}
