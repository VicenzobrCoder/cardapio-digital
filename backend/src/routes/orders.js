const express = require('express');
const { getDb } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const ORDER_STATUS = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  received: 'Recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

function generateOrderNumber(db) {
  const last = db.prepare("SELECT order_number FROM orders ORDER BY id DESC LIMIT 1").get();
  if (!last) return '#0001';
  const num = parseInt(last.order_number.replace('#', '')) + 1;
  return '#' + String(num).padStart(4, '0');
}

// POST /api/orders — criar pedido (público)
router.post('/', (req, res) => {
  const { customer_name, customer_phone, order_type, payment_method, items, address, notes } = req.body;

  if (!customer_name || !customer_phone || !items?.length) {
    return res.status(400).json({ error: 'Nome, telefone e itens são obrigatórios' });
  }
  if (order_type === 'delivery' && !address?.neighborhood) {
    return res.status(400).json({ error: 'Endereço é obrigatório para entrega' });
  }

  const db = getDb();

  // Buscar taxa de entrega do bairro
  let deliveryFee = 0;
  let estimatedTime = null;
  if (order_type === 'delivery' && address?.neighborhood) {
    const neighborhood = db.prepare(
      'SELECT * FROM delivery_neighborhoods WHERE neighborhood = ? AND active = 1'
    ).get(address.neighborhood);
    if (neighborhood) {
      deliveryFee = neighborhood.fee;
      estimatedTime = neighborhood.max_time;
    } else {
      // Taxa fixa de fallback
      const settings = db.prepare('SELECT delivery_fee_value FROM settings WHERE id = 1').get();
      deliveryFee = settings?.delivery_fee_value || 0;
    }
  }

  // Calcular subtotal validando preços no banco
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND available = 1').get(item.product_id);
    if (!product) {
      return res.status(400).json({ error: `Produto "${item.product_name}" não está disponível` });
    }

    let unitPrice = product.promo_price || product.price;

    // Adicionar extras das opções
    const optionsPrices = (item.selected_options || []).reduce((sum, opt) => {
      return sum + (opt.extra_price || 0);
    }, 0);
    unitPrice += optionsPrices;

    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: item.notes || null,
      options_summary: item.selected_options?.map(o => o.name).join(', ') || null,
    });
  }

  const total = subtotal + deliveryFee;
  const settings = db.prepare('SELECT min_order_value FROM settings WHERE id = 1').get();

  if (settings?.min_order_value && subtotal < settings.min_order_value) {
    return res.status(400).json({
      error: `Pedido mínimo de ${formatCurrency(settings.min_order_value)}`
    });
  }

  const orderNumber = generateOrderNumber(db);

  const result = db.prepare(`
    INSERT INTO orders (
      order_number, customer_name, customer_phone, order_type, status,
      payment_method, subtotal, delivery_fee, total,
      address_street, address_number, address_complement,
      address_neighborhood, address_city, notes, estimated_time
    ) VALUES (?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNumber, customer_name, customer_phone,
    order_type || 'delivery', payment_method || 'cash',
    subtotal, deliveryFee, total,
    address?.street || null, address?.number || null,
    address?.complement || null, address?.neighborhood || null,
    address?.city || null, notes || null,
    estimatedTime
  );

  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, unit_price, total_price, notes, options_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  validatedItems.forEach(item => {
    insertItem.run(
      orderId, item.product_id, item.product_name, item.product_price,
      item.quantity, item.unit_price, item.total_price,
      item.notes, item.options_summary
    );
  });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json(order);
});

// GET /api/orders/:orderNumber — status público de um pedido
router.get('/track/:orderNumber', (req, res) => {
  const db = getDb();
  const order = db.prepare(
    'SELECT * FROM orders WHERE order_number = ?'
  ).get(req.params.orderNumber);

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  order.status_label = STATUS_LABELS[order.status];
  res.json(order);
});

// --- Rotas protegidas (admin) ---

// GET /api/orders — lista de pedidos para o admin
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, date, page = 1, limit = 20 } = req.query;

  let where = '1=1';
  const params = [];

  if (status && status !== 'all') { where += ' AND status = ?'; params.push(status); }
  if (date) { where += ' AND date(created_at) = ?'; params.push(date); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const orders = db.prepare(`
    SELECT * FROM orders WHERE ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${where}`).get(...params).count;

  orders.forEach(o => {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
    o.status_label = STATUS_LABELS[o.status];
  });

  res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/orders/dashboard — resumo do dia
router.get('/dashboard', authMiddleware, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
    FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
  `).get(today);

  const openOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE status IN ('received', 'preparing', 'out_for_delivery')
  `).get();

  const recentOrders = db.prepare(`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
  `).all();

  recentOrders.forEach(o => { o.status_label = STATUS_LABELS[o.status]; });

  const topProducts = db.prepare(`
    SELECT product_name, SUM(quantity) as total_sold, SUM(total_price) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE date(o.created_at) = ? AND o.status != 'cancelled'
    GROUP BY product_name ORDER BY total_sold DESC LIMIT 5
  `).all(today);

  res.json({
    today_orders: todayOrders.count,
    today_revenue: todayOrders.total,
    open_orders: openOrders.count,
    recent_orders: recentOrders,
    top_products: topProducts,
  });
});

// GET /api/orders/reports — relatório por período
router.get('/reports', authMiddleware, (req, res) => {
  const db = getDb();
  const { start, end } = req.query;

  const dateFilter = start && end
    ? `AND date(o.created_at) BETWEEN '${start}' AND '${end}'`
    : `AND date(o.created_at) = date('now')`;

  const summary = db.prepare(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as revenue,
           COALESCE(SUM(delivery_fee), 0) as delivery_revenue
    FROM orders WHERE status != 'cancelled' ${dateFilter}
  `).get();

  const byDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE status != 'cancelled' ${dateFilter}
    GROUP BY day ORDER BY day
  `).all();

  const topProducts = db.prepare(`
    SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' ${dateFilter}
    GROUP BY oi.product_name ORDER BY total_sold DESC LIMIT 10
  `).all();

  const byPayment = db.prepare(`
    SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE status != 'cancelled' ${dateFilter}
    GROUP BY payment_method
  `).all();

  res.json({ summary, by_day: byDay, top_products: topProducts, by_payment: byPayment });
});

// GET /api/orders/:id — pedido específico (admin)
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  order.status_label = STATUS_LABELS[order.status];
  res.json(order);
});

// PATCH /api/orders/:id/status — avançar status
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status, cancelled_reason } = req.body;
  if (!ORDER_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  db.prepare(`
    UPDATE orders SET status = ?, cancelled_reason = ?, updated_at = datetime('now') WHERE id = ?
  `).run(status, cancelled_reason || null, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  updated.status_label = STATUS_LABELS[updated.status];
  res.json(updated);
});

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

module.exports = router;
