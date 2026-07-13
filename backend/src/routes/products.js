const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configuração de upload de imagens
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  },
});

function getProductWithOptions(db, id) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return null;

  const options = db.prepare('SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order').all(id);
  options.forEach(opt => {
    opt.items = db.prepare('SELECT * FROM option_items WHERE option_id = ?').all(opt.id);
  });
  product.options = options;
  return product;
}

// GET /api/products — lista pública por categoria
router.get('/', (req, res) => {
  const db = getDb();
  const { category_id, featured, search } = req.query;

  let where = 'WHERE p.available = 1';
  const params = [];

  if (category_id) { where += ' AND p.category_id = ?'; params.push(category_id); }
  if (featured) { where += ' AND p.featured = 1'; params.push(); }
  if (search) { where += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.icon as category_icon
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ${where}
    ORDER BY p.sort_order, p.name
  `).all(...params);

  res.json(products);
});

// GET /api/products/menu — cardápio completo agrupado por categoria
router.get('/menu', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name
  `).all();

  const menu = categories.map(cat => {
    const products = db.prepare(`
      SELECT * FROM products WHERE category_id = ? AND available = 1 ORDER BY sort_order, name
    `).all(cat.id);

    products.forEach(p => {
      const options = db.prepare('SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order').all(p.id);
      options.forEach(opt => {
        opt.items = db.prepare('SELECT * FROM option_items WHERE option_id = ?').all(opt.id);
      });
      p.options = options;
    });

    return { ...cat, products };
  });

  res.json(menu);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = getProductWithOptions(db, req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

// --- Rotas protegidas (admin) ---

// GET /api/products/admin/all — todos os produtos para o admin
router.get('/admin/all', authMiddleware, (req, res) => {
  const db = getDb();
  const { category_id } = req.query;
  let where = '1=1';
  const params = [];
  if (category_id) { where += ' AND p.category_id = ?'; params.push(category_id); }

  const products = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${where}
    ORDER BY c.sort_order, p.sort_order, p.name
  `).all(...params);
  res.json(products);
});

// POST /api/products
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const { category_id, name, description, price, promo_price, featured, sort_order, serves } = req.body;
  if (!category_id || !name || !price) {
    return res.status(400).json({ error: 'Categoria, nome e preço são obrigatórios' });
  }

  const db = getDb();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, price, promo_price, image_url, featured, sort_order, serves)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id, name, description || null, parseFloat(price),
    promo_price ? parseFloat(promo_price) : null,
    imageUrl, featured ? 1 : 0, sort_order || 0, serves || 1
  );

  // Processar opções se enviadas
  if (req.body.options) {
    try {
      const options = JSON.parse(req.body.options);
      options.forEach(opt => {
        const optResult = db.prepare(`
          INSERT INTO product_options (product_id, name, type, required, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).run(result.lastInsertRowid, opt.name, opt.type || 'single', opt.required ? 1 : 0, opt.sort_order || 0);

        (opt.items || []).forEach(item => {
          db.prepare('INSERT INTO option_items (option_id, name, extra_price) VALUES (?, ?, ?)').run(
            optResult.lastInsertRowid, item.name, item.extra_price || 0
          );
        });
      });
    } catch {}
  }

  res.status(201).json(getProductWithOptions(db, result.lastInsertRowid));
});

// PUT /api/products/:id
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const { category_id, name, description, price, promo_price, available, featured, sort_order, serves } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image_url ?? product.image_url;

  db.prepare(`
    UPDATE products SET
      category_id = ?, name = ?, description = ?, price = ?, promo_price = ?,
      image_url = ?, available = ?, featured = ?, sort_order = ?, serves = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    category_id ?? product.category_id,
    name ?? product.name,
    description ?? product.description,
    price ? parseFloat(price) : product.price,
    promo_price ? parseFloat(promo_price) : product.promo_price,
    imageUrl,
    available !== undefined ? (available ? 1 : 0) : product.available,
    featured !== undefined ? (featured ? 1 : 0) : product.featured,
    sort_order ?? product.sort_order,
    serves ?? product.serves,
    req.params.id
  );

  res.json(getProductWithOptions(db, req.params.id));
});

// PATCH /api/products/:id/availability — ativar/desativar sem deletar
router.patch('/:id/availability', authMiddleware, (req, res) => {
  const db = getDb();
  const { available } = req.body;
  db.prepare('UPDATE products SET available = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    available ? 1 : 0, req.params.id
  );
  res.json({ message: 'Disponibilidade atualizada' });
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Produto removido' });
});

// POST /api/products/upload — upload de imagem avulso
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
