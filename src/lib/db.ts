import mysql from 'mysql2/promise';

// Konfigurasi koneksi MySQL (Laragon default)
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rekap_sales',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Singleton pool — satu pool untuk seluruh aplikasi
let _pool: mysql.Pool | null = null;
let _initialized = false;

export function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool(DB_CONFIG);
  }
  return _pool;
}

// Inisialisasi database & tabel (dipanggil sekali saat pertama kali akses)
async function ensureInit(): Promise<void> {
  if (_initialized) return;

  const pool = getPool();

  // Buat database jika belum ada (koneksi tanpa database dulu)
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });
  await tempConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConn.end();

  // =================== Tabel Users ===================
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nama VARCHAR(255) NOT NULL,
      role ENUM('admin', 'sales') NOT NULL
    )
  `);

  // Seed default admin jika belum ada
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE id = ?',
    ['admin-001']
  );
  if ((rows as any[]).length === 0) {
    await pool.execute(
      'INSERT INTO users (id, username, password, nama, role) VALUES (?, ?, ?, ?, ?)',
      ['admin-001', 'admin', adminPassword, 'Administrator', 'admin']
    );
  } else {
    // Update password admin jika berubah di .env
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [adminPassword, 'admin-001']
    );
  }

  // =================== Tabel Prospects ===================
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS prospects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggalRekap VARCHAR(100) NOT NULL,
      namaSales VARCHAR(255) NOT NULL,
      namaCust VARCHAR(255) NOT NULL,
      noHP VARCHAR(50) DEFAULT '',
      alamat TEXT DEFAULT (''),
      penghasilanEstimasi VARCHAR(255) DEFAULT '',
      produkDiminati VARCHAR(255) DEFAULT '',
      urgensi VARCHAR(255) DEFAULT '',
      status ENUM('Hot', 'Warm', 'Cold') NOT NULL DEFAULT 'Cold',
      skorPrioritas INT NOT NULL DEFAULT 5,
      catatanAI TEXT,
      namaFile VARCHAR(500) DEFAULT '',
      masalahCustomer TEXT,
      catatanSales TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index untuk performa query dashboard
  // MySQL ignores IF NOT EXISTS for indexes, so we use a try-catch approach
  const indexQueries = [
    'CREATE INDEX idx_prospects_status ON prospects(status)',
    'CREATE INDEX idx_prospects_sales ON prospects(namaSales)',
    'CREATE INDEX idx_prospects_skor ON prospects(skorPrioritas DESC)',
  ];
  for (const q of indexQueries) {
    try {
      await pool.execute(q);
    } catch {
      // Index sudah ada — abaikan
    }
  }

  _initialized = true;
}

// Helper: ambil koneksi pool yang sudah ter-inisialisasi
export async function getDb(): Promise<mysql.Pool> {
  await ensureInit();
  return getPool();
}
