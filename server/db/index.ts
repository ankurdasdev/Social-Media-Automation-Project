import { Pool } from "pg";
import bcrypt from "bcryptjs";

// DATABASE_URL format:
// Force connection to VPS proxy for local development to bypass any frozen/cached env variables in Vite
const rawEnvUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

let dbConfig: any = {};
const DATABASE_URL = isProduction 
  ? (rawEnvUrl || "postgresql://ankur:Password123!@casthub_db:5432/casthub_prod")
  : "postgresql://ankur:Password123!@46.62.144.244:15432/casthub_prod";

try {
  // Manual parsing of the connection string to force credentials and avoid PG environment variable fallback
  const url = new URL(DATABASE_URL);
  dbConfig = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    database: url.pathname.slice(1),
    ssl: false, // Internal or proxied connection
  };
} catch (err) {
  console.error("🛠️ [ERROR] Failed to parse DATABASE_URL:", DATABASE_URL);
  dbConfig = { connectionString: DATABASE_URL }; // Fallback
}

console.log(`🛠️ [DEBUG] Pool connecting to ${dbConfig.host}:${dbConfig.port} as user: ${dbConfig.user}`);

export const pool = new Pool({
  ...dbConfig,
  max: 5,
  idleTimeoutMillis: 2000,
  connectionTimeoutMillis: 10000,
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
  const passwordHash = await bcrypt.hash(testPassword, 12);

  try {
    await query(
      `INSERT INTO users (id, email, name, password_hash) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash`,
      [testId, testEmail, testName, passwordHash]
    );
    console.log("🛠️  Testing admin user seeded/updated: testing@test.com / testing");
  } catch (err) {
    console.error("❌ Failed to seed testing user:", err);
  }
}

async function runMigrations(): Promise<void> {
  // Add new columns safely to existing tables first
  await query(`
     ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_keywords JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS instagram_completed TEXT;
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS personalized_name_wa TEXT DEFAULT 'N';
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS personalized_name_gmail TEXT DEFAULT 'N';
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS personalized_name_ig TEXT DEFAULT 'N';
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS has_custom_message_wa BOOLEAN DEFAULT FALSE;
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS has_custom_message_email BOOLEAN DEFAULT FALSE;
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS has_custom_message_ig BOOLEAN DEFAULT FALSE;
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS unified_attachments JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS url TEXT;
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'whatsapp';
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS status_message TEXT;
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS member_count INTEGER;
    ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMPTZ;
  `).catch(() => {}); // Ignore if tables don't exist yet — they will be created below

  const sql = `
    -- Users table (for multi-user support)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      ai_keywords JSONB DEFAULT '[]'::jsonb,
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
      instagram_completed TEXT,
      personalized_name_wa TEXT DEFAULT 'N',
      personalized_name_gmail TEXT DEFAULT 'N',
      personalized_name_ig TEXT DEFAULT 'N',
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
      unified_attachments JSONB DEFAULT '[]',
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
      email_subject TEXT,
      is_attachment BOOLEAN DEFAULT FALSE,
      attachment_url TEXT,
      attachment_detail_text TEXT,
      drive_file_id TEXT,
      drive_file_name TEXT,
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
