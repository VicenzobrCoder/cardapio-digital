const express = require('express');
const { getDb } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — lista pública (somente ativas)
router.get('/', (req, res) => {
  const db = getDb();
  const { includeInactive } = req.query;
  const where = includeInactive ? '' : 'WHERE c.active = 1';
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.available = 1
    ${where}
    GROUP BY c.id
    ORDER BY c.sort_order, c.name
  `).all();
  res.json(categories);
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });
  res.json(category);
});

// --- Rotas protegidas (admin) ---

// POST /api/categories
router.post('/', authMiddleware, (req, res) => {
  const { name, description, icon, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO categories (name, description, icon, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(name, description || null, icon || '🍽️', sort_order || 0);

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/categories/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { name, description, icon, sort_order, active } = req.body;
  const db = getDb();
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });

  db.prepare(`
    UPDATE categories SET name = ?, description = ?, icon = ?, sort_order = ?, active = ?
    WHERE id = ?
  `).run(
    name ?? cat.name,
    description ?? cat.description,
    icon ?? cat.icon,
    sort_order ?? cat.sort_order,
    active !== undefined ? (active ? 1 : 0) : cat.active,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Categoria removida' });
});

module.exports = router;
