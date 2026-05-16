import pg from 'pg';
import dotenv from 'dotenv';


dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// ==========================================
// INITIALIZE DATABASE
// ==========================================

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create tables if they don't exist
    await createTables(client);

    client.release();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// ==========================================
// CREATE TABLES
// ==========================================

async function createTables(client) {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      plan VARCHAR(20) CHECK (plan IN ('FREE', 'BASIC', 'PRO')) DEFAULT 'FREE',
      stripe_customer_id VARCHAR(255),
      tokens_limit INT DEFAULT 50,
      tokens_remaining INT DEFAULT 50,
      tokens_reset_date TIMESTAMP DEFAULT NOW() + INTERVAL '1 month',
      subscription_active BOOLEAN DEFAULT false,
      subscription_start TIMESTAMP,
      subscription_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Prospects table
    `CREATE TABLE IF NOT EXISTS prospects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      linkedin_url VARCHAR(500),
      company VARCHAR(255),
      job_title VARCHAR(255),
      city VARCHAR(100),
      status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'RESPONDED', 'RDV_SCHEDULED', 'RDV_CONFIRMED', 'CLOSED')),
      messages_sent INT DEFAULT 0,
      last_contacted TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // API logs table
    `CREATE TABLE IF NOT EXISTS api_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      agent_type VARCHAR(100),
      tokens_used INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
      request_payload JSONB,
      response_payload JSONB,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // Agent runs table
    `CREATE TABLE IF NOT EXISTS agent_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_name VARCHAR(100),
      prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
      input_data JSONB,
      output_data JSONB,
      tokens_consumed INT DEFAULT 0,
      execution_time_ms INT,
      status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED')),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // Create indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);`,
    `CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);`
  ];

  for (const query of queries) {
    try {
      await client.query(query);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error creating table:', error);
        throw error;
      }
    }
  }

  console.log('✅ All tables initialized');
}

// ==========================================
// DATABASE QUERY HELPER
// ==========================================

export async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', {
      query: text,
      error: error.message
    });
    throw error;
  }
}

// ==========================================
// CLOSE CONNECTION
// ==========================================

export async function closeDatabase() {
  await pool.end();
  console.log('✅ Database connection closed');
}
