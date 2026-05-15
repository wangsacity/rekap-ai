import { Pool, PoolConfig } from 'pg';

// Konfigurasi koneksi PostgreSQL
const DB_CONFIG: PoolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'rekap_sales',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Singleton pool — satu pool untuk seluruh aplikasi
let _pool: Pool | null = null;
let _initialized = false;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool(DB_CONFIG);
  }
  return _pool;
}

// Inisialisasi database & tabel (dipanggil sekali saat pertama kali akses)
async function ensureInit(): Promise<void> {
  if (_initialized) return;

  const pool = getPool();

  // PostgreSQL doesn't allow CREATE DATABASE IF NOT EXISTS inside a transaction or easily from a connected pool if the DB doesn't exist.
  // We assume the database is already created by the user or provisioning script.
  // We will just create tables if they don't exist.

  // =================== Tabel Users ===================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nama VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales'))
    )
  `);

  // Seed default admin jika belum ada
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const res = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    ['admin-001']
  );
  if (res.rowCount === 0) {
    await pool.query(
      'INSERT INTO users (id, username, password, nama, role) VALUES ($1, $2, $3, $4, $5)',
      ['admin-001', 'admin', adminPassword, 'Administrator', 'admin']
    );
  } else {
    // Update password admin jika berubah di .env
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [adminPassword, 'admin-001']
    );
  }

  // =================== Tabel Prospects ===================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prospects (
      id SERIAL PRIMARY KEY,
      "tanggalRekap" VARCHAR(100) NOT NULL,
      "namaSales" VARCHAR(255) NOT NULL,
      "namaCust" VARCHAR(255) NOT NULL,
      "noHP" VARCHAR(50) DEFAULT '',
      alamat TEXT DEFAULT '',
      "penghasilanEstimasi" VARCHAR(255) DEFAULT '',
      "produkDiminati" VARCHAR(255) DEFAULT '',
      urgensi VARCHAR(255) DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'Cold' CHECK (status IN ('Hot', 'Warm', 'Cold')),
      "skorPrioritas" INT NOT NULL DEFAULT 5,
      "catatanAI" TEXT,
      "namaFile" VARCHAR(500) DEFAULT '',
      "masalahCustomer" TEXT,
      "catatanSales" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index untuk performa query dashboard
  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status)',
    'CREATE INDEX IF NOT EXISTS idx_prospects_sales ON prospects("namaSales")',
    'CREATE INDEX IF NOT EXISTS idx_prospects_skor ON prospects("skorPrioritas" DESC)',
  ];
  for (const q of indexQueries) {
    try {
      await pool.query(q);
    } catch {
      // Index sudah ada — abaikan
    }
  }

  _initialized = true;
}

// Helper: ambil koneksi pool yang sudah ter-inisialisasi
export async function getDb(): Promise<Pool> {
  await ensureInit();
  return getPool();
}
