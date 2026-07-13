// Usando node:sqlite nativo do Node.js 22+ (sem dependência externa)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../cardapio.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      restaurant_name TEXT NOT NULL DEFAULT 'Meu Restaurante',
      logo_url TEXT,
      banner_url TEXT,
      whatsapp TEXT NOT NULL DEFAULT '5511999999999',
      opening_hours TEXT DEFAULT '{"seg-sex": "11h às 22h", "sab-dom": "11h às 23h"}',
      address TEXT,
      is_open INTEGER DEFAULT 1,
      delivery_fee_type TEXT DEFAULT 'fixed',
      delivery_fee_value REAL DEFAULT 5.00,
      min_order_value REAL DEFAULT 0,
      pix_key TEXT,
      primary_color TEXT DEFAULT '#E63946',
      secondary_color TEXT DEFAULT '#457B9D',
      accent_color TEXT DEFAULT '#F1A208',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS delivery_neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'São Paulo',
      fee REAL NOT NULL,
      min_time INTEGER DEFAULT 30,
      max_time INTEGER DEFAULT 60,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🍽️',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      promo_price REAL,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      serves INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'single',
      required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS option_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      extra_price REAL DEFAULT 0,
      FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_type TEXT NOT NULL DEFAULT 'delivery',
      status TEXT NOT NULL DEFAULT 'received',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      subtotal REAL NOT NULL,
      delivery_fee REAL DEFAULT 0,
      total REAL NOT NULL,
      address_street TEXT,
      address_number TEXT,
      address_complement TEXT,
      address_neighborhood TEXT,
      address_city TEXT,
      notes TEXT,
      estimated_time INTEGER,
      cancelled_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      notes TEXT,
      options_summary TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);
}

module.exports = { getDb };
