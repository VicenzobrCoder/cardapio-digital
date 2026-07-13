const express = require('express');
const { getDb } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — configurações públicas do restaurante
router.get('/', (req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

  // Remover campos sensíveis da resposta pública
  const { ...publicSettings } = settings;
  delete publicSettings.pix_key;

  try {
    publicSettings.opening_hours = JSON.parse(publicSettings.opening_hours);
  } catch {}

  const neighborhoods = db.prepare(
    'SELECT * FROM delivery_neighborhoods WHERE active = 1 ORDER BY neighborhood'
  ).all();
  publicSettings.delivery_neighborhoods = neighborhoods;

  res.json(publicSettings);
});

// GET /api/settings/admin — configurações completas para o admin
router.get('/admin', authMiddleware, (req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const neighborhoods = db.prepare(
    'SELECT * FROM delivery_neighborhoods ORDER BY neighborhood'
  ).all();

  try { settings.opening_hours = JSON.parse(settings.opening_hours); } catch {}
  settings.delivery_neighborhoods = neighborhoods;
  res.json(settings);
});

// PUT /api/settings — atualizar configurações
router.put('/', authMiddleware, (req, res) => {
  const db = getDb();
  const current = db.prepare('SELECT * FROM settings WHERE id = 1').get();

  const {
    restaurant_name, logo_url, banner_url, whatsapp,
    opening_hours, address, is_open,
    delivery_fee_type, delivery_fee_value, min_order_value,
    pix_key, primary_color, secondary_color, accent_color,
  } = req.body;

  const openingHoursStr = typeof opening_hours === 'object'
    ? JSON.stringify(opening_hours)
    : opening_hours ?? current.opening_hours;

  db.prepare(`
    UPDATE settings SET
      restaurant_name = ?,
      logo_url = ?,
      banner_url = ?,
      whatsapp = ?,
      opening_hours = ?,
      address = ?,
      is_open = ?,
      delivery_fee_type = ?,
      delivery_fee_value = ?,
      min_order_value = ?,
      pix_key = ?,
      primary_color = ?,
      secondary_color = ?,
      accent_color = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    restaurant_name ?? current.restaurant_name,
    logo_url ?? current.logo_url,
    banner_url ?? current.banner_url,
    whatsapp ?? current.whatsapp,
    openingHoursStr,
    address ?? current.address,
    is_open !== undefined ? (is_open ? 1 : 0) : current.is_open,
    delivery_fee_type ?? current.delivery_fee_type,
    delivery_fee_value !== undefined ? parseFloat(delivery_fee_value) : current.delivery_fee_value,
    min_order_value !== undefined ? parseFloat(min_order_value) : current.min_order_value,
    pix_key ?? current.pix_key,
    primary_color ?? current.primary_color,
    secondary_color ?? current.secondary_color,
    accent_color ?? current.accent_color,
  );

  const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  try { updated.opening_hours = JSON.parse(updated.opening_hours); } catch {}
  res.json(updated);
});

// POST /api/settings/neighborhoods — adicionar bairro
router.post('/neighborhoods', authMiddleware, (req, res) => {
  const { neighborhood, city, fee, min_time, max_time } = req.body;
  if (!neighborhood || fee === undefined) {
    return res.status(400).json({ error: 'Bairro e taxa são obrigatórios' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO delivery_neighborhoods (neighborhood, city, fee, min_time, max_time)
    VALUES (?, ?, ?, ?, ?)
  `).run(neighborhood, city || 'São Paulo', parseFloat(fee), min_time || 30, max_time || 60);

  res.status(201).json(
    db.prepare('SELECT * FROM delivery_neighborhoods WHERE id = ?').get(result.lastInsertRowid)
  );
});

// PUT /api/settings/neighborhoods/:id
router.put('/neighborhoods/:id', authMiddleware, (req, res) => {
  const { neighborhood, city, fee, min_time, max_time, active } = req.body;
  const db = getDb();
  const current = db.prepare('SELECT * FROM delivery_neighborhoods WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Bairro não encontrado' });

  db.prepare(`
    UPDATE delivery_neighborhoods SET neighborhood = ?, city = ?, fee = ?, min_time = ?, max_time = ?, active = ?
    WHERE id = ?
  `).run(
    neighborhood ?? current.neighborhood, city ?? current.city,
    fee !== undefined ? parseFloat(fee) : current.fee,
    min_time ?? current.min_time, max_time ?? current.max_time,
    active !== undefined ? (active ? 1 : 0) : current.active,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM delivery_neighborhoods WHERE id = ?').get(req.params.id));
});

// DELETE /api/settings/neighborhoods/:id
router.delete('/neighborhoods/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM delivery_neighborhoods WHERE id = ?').run(req.params.id);
  res.json({ message: 'Bairro removido' });
});

module.exports = router;
