import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if not in process.env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local or environment.');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function seed() {
  console.log('🚀 Connecting to Turso database at:', url);

  // 1. Create tables
  console.log('📦 Creating tables if they do not exist...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      chart_description TEXT,
      illustration_type TEXT,
      min_word_count INTEGER NOT NULL DEFAULT 250,
      recommended_time_minutes INTEGER NOT NULL DEFAULT 40,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      target_band TEXT DEFAULT '7.0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      prompt_id TEXT,
      task_type TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      target_band TEXT DEFAULT '7.0',
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      user_id TEXT,
      overall_band REAL NOT NULL,
      task_response_score REAL NOT NULL,
      coherence_score REAL NOT NULL,
      lexical_score REAL NOT NULL,
      grammar_score REAL NOT NULL,
      examiner_summary TEXT,
      report_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Tables created successfully.');

  // 2. Read seed.sql to insert prompts
  const seedSqlPath = path.resolve(process.cwd(), 'supabase/seed.sql');
  if (fs.existsSync(seedSqlPath)) {
    console.log('🌱 Seeding 160 prompts from supabase/seed.sql...');
    const seedContent = fs.readFileSync(seedSqlPath, 'utf-8');
    
    // SQLite uses `INSERT OR REPLACE INTO` instead of PostgreSQL's `ON CONFLICT (...) DO UPDATE`
    // Convert to compatible SQLite syntax or parse individual values
    const insertMatch = seedContent.match(/INSERT INTO public\.prompts[^\(]*\(([^\)]+)\)\s*VALUES\s*([\s\S]+?)\s*ON CONFLICT/i);
    
    if (insertMatch) {
      const columns = insertMatch[1];
      const valuesBlock = insertMatch[2];
      
      const insertSql = `INSERT OR REPLACE INTO prompts (${columns}) VALUES ${valuesBlock};`;
      await client.execute(insertSql);
      console.log('🎉 Successfully seeded all 160 prompts into Turso!');
    } else {
      console.log('⚠️ Could not parse seed.sql, please run individual inserts.');
    }
  }

  const countRes = await client.execute('SELECT COUNT(*) as count FROM prompts');
  console.log(`📊 Total prompts currently in Turso DB: ${countRes.rows[0].count}`);
  console.log('✨ All done!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
