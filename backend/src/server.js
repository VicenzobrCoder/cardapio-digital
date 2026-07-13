require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar banco e fazer seed automático se necessário
async function bootstrap() {
  const db = getDb();

  // Se não houver admin cadastrado, rodar seed automático
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCount.count === 0) {
    console.log('🌱 Primeira execução detectada — populando banco com dados de exemplo...');
    try {
      require('./database/seed');
    } catch (e) {
      console.error('Erro no seed automático:', e.message);
    }
  }
}

bootstrap();

// Middlewares
// ⚙️ PERSONALIZAÇÃO: Adicione o domínio do Vercel em FRONTEND_URL no Railway
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return cb(null, true);
    // Permitir qualquer subdomínio do vercel.app
    if (origin.includes('vercel.app') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir uploads de imagens
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🍽️  Servidor Cardápio Digital rodando em http://localhost:${PORT}`);
  console.log(`📊 Admin API em http://localhost:${PORT}/api`);
});
