require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

async function seed() {
  const db = getDb();
  console.log('🌱 Populando banco de dados com dados de exemplo...');

  // Limpar dados existentes (exceto settings)
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM option_items;
    DELETE FROM product_options;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM delivery_neighborhoods;
    DELETE FROM admins;
  `);

  // Configurações do restaurante de exemplo
  // ⚙️ PERSONALIZAÇÃO: Altere os dados abaixo para cada cliente novo
  db.prepare(`
    UPDATE settings SET
      restaurant_name = 'Sabor do Chef',
      whatsapp = '5511999999999',
      address = 'Rua das Flores, 123 - Centro, São Paulo - SP',
      opening_hours = '{"seg-sex": "11h às 22h", "sab-dom": "11h às 23h"}',
      delivery_fee_type = 'neighborhood',
      delivery_fee_value = 5.00,
      min_order_value = 20.00,
      pix_key = 'restaurante@email.com',
      primary_color = '#E63946',
      secondary_color = '#457B9D',
      accent_color = '#F1A208'
    WHERE id = 1
  `).run();

  // Bairros com taxa de entrega
  const neighborhoods = [
    { neighborhood: 'Centro', city: 'São Paulo', fee: 4.00, min_time: 20, max_time: 35 },
    { neighborhood: 'Jardins', city: 'São Paulo', fee: 6.00, min_time: 25, max_time: 40 },
    { neighborhood: 'Moema', city: 'São Paulo', fee: 7.00, min_time: 30, max_time: 50 },
    { neighborhood: 'Vila Madalena', city: 'São Paulo', fee: 8.00, min_time: 35, max_time: 55 },
    { neighborhood: 'Pinheiros', city: 'São Paulo', fee: 6.50, min_time: 30, max_time: 45 },
    { neighborhood: 'Lapa', city: 'São Paulo', fee: 9.00, min_time: 40, max_time: 60 },
  ];

  const insertNeighborhood = db.prepare(`
    INSERT INTO delivery_neighborhoods (neighborhood, city, fee, min_time, max_time) VALUES (?, ?, ?, ?, ?)
  `);
  neighborhoods.forEach(n => insertNeighborhood.run(n.neighborhood, n.city, n.fee, n.min_time, n.max_time));

  // Categorias do cardápio
  const categories = [
    { name: 'Entradas', description: 'Petiscos e aperitivos para começar bem', icon: '🥗', sort_order: 1 },
    { name: 'Pratos Principais', description: 'Nossos pratos mais amados', icon: '🍖', sort_order: 2 },
    { name: 'Massas', description: 'Massas artesanais feitas no dia', icon: '🍝', sort_order: 3 },
    { name: 'Grelhados', description: 'Carnes e frutos do mar na brasa', icon: '🥩', sort_order: 4 },
    { name: 'Sobremesas', description: 'Para adoçar o final da refeição', icon: '🍮', sort_order: 5 },
    { name: 'Bebidas', description: 'Refrigerantes, sucos e muito mais', icon: '🥤', sort_order: 6 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, description, icon, sort_order) VALUES (?, ?, ?, ?)
  `);
  const categoryIds = {};
  categories.forEach(c => {
    const result = insertCategory.run(c.name, c.description, c.icon, c.sort_order);
    categoryIds[c.name] = result.lastInsertRowid;
  });

  // Produtos de exemplo
  const products = [
    // Entradas
    {
      category: 'Entradas', name: 'Coxinha Artesanal', featured: 1,
      description: 'Coxinha crocante recheada com frango desfiado temperado, requeijão cremoso e catupiry. Porção com 6 unidades.',
      price: 28.90, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', serves: 2
    },
    {
      category: 'Entradas', name: 'Bolinho de Bacalhau',
      description: 'Tradicional bolinho de bacalhau português, crocante por fora e cremoso por dentro. Acompanha maionese de ervas. Porção com 8 unidades.',
      price: 35.90, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', serves: 2
    },
    {
      category: 'Entradas', name: 'Bruschetta Italiana',
      description: 'Pão italiano tostado com tomates frescos, manjericão, azeite extra virgem e alho. 4 unidades.',
      price: 22.00, image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80', serves: 2
    },
    {
      category: 'Entradas', name: 'Mandioca Frita',
      description: 'Mandioca crocante frita na hora, temperada com sal grosso e servida com vinagrete e molho aioli.',
      price: 24.90, image_url: 'https://images.unsplash.com/photo-1541592553160-82008b127ccb?w=400&q=80', serves: 2
    },

    // Pratos Principais
    {
      category: 'Pratos Principais', name: 'Feijoada Completa', featured: 1,
      description: 'Clássica feijoada com feijão preto, carnes variadas (paio, linguiça, costela, lombo), acompanha arroz, couve refogada, laranja e farofa. Serve 2 pessoas.',
      price: 89.90, image_url: 'https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=400&q=80', serves: 2
    },
    {
      category: 'Pratos Principais', name: 'Frango ao Molho Pardo',
      description: 'Frango caipira cozido lentamente em molho pardo encorpado com ervas da horta. Acompanha arroz, tutu de feijão e couve.',
      price: 65.00, image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80', serves: 1
    },
    {
      category: 'Pratos Principais', name: 'Picanha na Brasa',
      description: 'Picanha premium grelhada no carvão, 300g, servida com farofa de manteiga, vinagrete, arroz e feijão.',
      price: 95.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', serves: 1
    },
    {
      category: 'Pratos Principais', name: 'Moqueca de Peixe',
      description: 'Tradicional moqueca baiana com filé de robalo, azeite de dendê, leite de coco, pimentões coloridos e coentro. Acompanha arroz branco e pirão.',
      price: 79.90, image_url: 'https://images.unsplash.com/photo-1611489704768-e5f6cdfc0cbb?w=400&q=80', serves: 2
    },

    // Massas
    {
      category: 'Massas', name: 'Carbonara Especial', featured: 1,
      description: 'Espaguete artesanal com molho cremoso de ovos, queijo pecorino, pancetta defumada e pimenta-do-reino moída na hora.',
      price: 58.00, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80', serves: 1
    },
    {
      category: 'Massas', name: 'Lasanha da Casa',
      description: 'Lasanha em camadas com ragù de carne, molho bechamel caseiro e queijos mozzarella e parmesão gratinados.',
      price: 62.90, image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80', serves: 1
    },
    {
      category: 'Massas', name: 'Nhoque ao Pesto',
      description: 'Nhoque de batata artesanal ao molho pesto de manjericão fresco, pinoli e parmesão.',
      price: 54.00, image_url: 'https://images.unsplash.com/photo-1627662055794-94c8b3f9bdf2?w=400&q=80', serves: 1
    },

    // Grelhados
    {
      category: 'Grelhados', name: 'Salmão Grelhado',
      description: 'Filé de salmão norueguês grelhado com manteiga de ervas, limão siciliano. Acompanha salada de rúcula e risoto de limão.',
      price: 89.00, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80', serves: 1
    },
    {
      category: 'Grelhados', name: 'Frango Grelhado Fit',
      description: 'Peito de frango grelhado temperado com ervas finas. Acompanha arroz integral, legumes no vapor e salada verde.',
      price: 48.90, image_url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=80', serves: 1
    },
    {
      category: 'Grelhados', name: 'Costela Bovina', featured: 1,
      description: 'Costela bovina assada por 12 horas, desfiando no garfo. Acompanha farofa de manteiga com bacon e couve refogada.',
      price: 110.00, image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', serves: 2
    },

    // Sobremesas
    {
      category: 'Sobremesas', name: 'Pudim de Leite Condensado',
      description: 'Clássico pudim de leite condensado com calda de caramelo dourado. Receita da vovó.',
      price: 18.90, image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', serves: 1
    },
    {
      category: 'Sobremesas', name: 'Petit Gâteau', featured: 1,
      description: 'Bolinho de chocolate quente com interior cremoso derretido, servido com uma bola de sorvete de creme.',
      price: 28.90, image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80', serves: 1
    },
    {
      category: 'Sobremesas', name: 'Romeu e Julieta',
      description: 'Queijo Minas Frescal com goiabada cascão artesanal. Sobremesa simples e deliciosa.',
      price: 14.90, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', serves: 1
    },

    // Bebidas
    {
      category: 'Bebidas', name: 'Suco de Laranja Natural',
      description: 'Suco de laranja espremido na hora, sem adição de açúcar. 500ml.',
      price: 12.00, image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80', serves: 1
    },
    {
      category: 'Bebidas', name: 'Refrigerante Lata',
      description: 'Coca-Cola, Guaraná, Sprite ou Fanta. Lata 350ml gelada.',
      price: 7.00, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', serves: 1
    },
    {
      category: 'Bebidas', name: 'Água Mineral',
      description: 'Água mineral sem gás ou com gás. 500ml.',
      price: 5.00, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', serves: 1
    },
    {
      category: 'Bebidas', name: 'Caipirinha de Limão', featured: 1,
      description: 'Caipirinha tradicional de limão taiti com cachaça artesanal, limão fresquinho e açúcar. Dose individual.',
      price: 22.00, image_url: 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=400&q=80', serves: 1
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, name, description, price, image_url, featured, serves)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const productIds = {};
  products.forEach(p => {
    const catId = categoryIds[p.category];
    const result = insertProduct.run(catId, p.name, p.description, p.price, p.image_url, p.featured || 0, p.serves || 1);
    productIds[p.name] = result.lastInsertRowid;
  });

  // Adicionar opções ao produto Picanha
  const picanhaId = productIds['Picanha na Brasa'];
  if (picanhaId) {
    const optPonto = db.prepare(`INSERT INTO product_options (product_id, name, type, required) VALUES (?, ?, ?, ?)`);
    const pointOpt = optPonto.run(picanhaId, 'Ponto da Carne', 'single', 1);

    const insertItem = db.prepare(`INSERT INTO option_items (option_id, name, extra_price) VALUES (?, ?, ?)`);
    ['Mal passado', 'Ao ponto para mal', 'Ao ponto', 'Ao ponto para bem', 'Bem passado'].forEach(p => {
      insertItem.run(pointOpt.lastInsertRowid, p, 0);
    });

    const acompOpt = db.prepare(`INSERT INTO product_options (product_id, name, type, required) VALUES (?, ?, ?, ?)`).run(picanhaId, 'Acompanhamento Extra', 'multiple', 0);
    [
      { name: 'Queijo coalho grelhado', price: 8.00 },
      { name: 'Ovo frito', price: 5.00 },
      { name: 'Bacon fatiado', price: 7.00 },
    ].forEach(i => insertItem.run(acompOpt.lastInsertRowid, i.name, i.price));
  }

  // Opções para Refrigerante
  const refriId = productIds['Refrigerante Lata'];
  if (refriId) {
    const sabOpt = db.prepare(`INSERT INTO product_options (product_id, name, type, required) VALUES (?, ?, ?, ?)`).run(refriId, 'Sabor', 'single', 1);
    const insertItem = db.prepare(`INSERT INTO option_items (option_id, name, extra_price) VALUES (?, ?, ?)`);
    ['Coca-Cola', 'Coca-Cola Zero', 'Guaraná Antarctica', 'Sprite', 'Fanta Laranja'].forEach(s => {
      insertItem.run(sabOpt.lastInsertRowid, s, 0);
    });
  }

  // Criar admin padrão
  // ⚙️ PERSONALIZAÇÃO: Troque email e senha padrão do admin aqui
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`).run(
    'Administrador', 'admin@sabordochef.com', hashedPassword
  );

  // Pedidos de exemplo para o dashboard
  const pedidoExemplo = db.prepare(`
    INSERT INTO orders (order_number, customer_name, customer_phone, order_type, status, payment_method, subtotal, delivery_fee, total, address_street, address_number, address_neighborhood, address_city, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const pedidos = [
    ['#0001', 'João Silva', '11987654321', 'delivery', 'delivered', 'pix', 89.90, 6.00, 95.90, 'Rua das Rosas', '45', 'Jardins', 'São Paulo', datetime(-2)],
    ['#0002', 'Maria Souza', '11976543210', 'pickup', 'delivered', 'card', 58.00, 0, 58.00, null, null, null, null, datetime(-1.5)],
    ['#0003', 'Pedro Costa', '11965432109', 'delivery', 'preparing', 'cash', 130.80, 7.00, 137.80, 'Av Paulista', '1000', 'Bela Vista', 'São Paulo', datetime(-0.3)],
    ['#0004', 'Ana Lima', '11954321098', 'delivery', 'received', 'pix', 46.80, 6.50, 53.30, 'Rua Oscar Freire', '220', 'Pinheiros', 'São Paulo', datetime(-0.1)],
  ];

  function datetime(hoursAgo) {
    const d = new Date(Date.now() + hoursAgo * 3600000);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  pedidos.forEach(p => pedidoExemplo.run(...p));

  // Itens dos pedidos de exemplo
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_name, product_price, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const allOrders = db.prepare('SELECT id, order_number FROM orders').all();
  const orderMap = {};
  allOrders.forEach(o => { orderMap[o.order_number] = o.id; });

  insertOrderItem.run(orderMap['#0001'], 'Feijoada Completa', 89.90, 1, 89.90, 89.90);
  insertOrderItem.run(orderMap['#0002'], 'Carbonara Especial', 58.00, 1, 58.00, 58.00);
  insertOrderItem.run(orderMap['#0003'], 'Picanha na Brasa', 95.00, 1, 95.00, 95.00);
  insertOrderItem.run(orderMap['#0003'], 'Suco de Laranja Natural', 12.00, 1, 12.00, 12.00);
  insertOrderItem.run(orderMap['#0003'], 'Pudim de Leite Condensado', 18.90, 1, 18.90, 18.90);
  insertOrderItem.run(orderMap['#0004'], 'Coxinha Artesanal', 28.90, 1, 28.90, 28.90);
  insertOrderItem.run(orderMap['#0004'], 'Refrigerante Lata', 7.00, 2, 7.00, 14.00);

  console.log('✅ Seed concluído com sucesso!');
  console.log('📧 Admin: admin@sabordochef.com | Senha: admin123');
  console.log('🔑 Lembre-se de trocar a senha em produção!');
}

// Executar diretamente via "npm run seed" ou importar do server.js
if (require.main === module) {
  seed().catch(console.error);
} else {
  // Quando importado, executar sincronamente via seed()
  seed().catch(console.error);
}
