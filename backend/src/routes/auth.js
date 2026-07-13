const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

// PUT /api/auth/password — trocar senha do admin
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, req.admin.id);
  res.json({ message: 'Senha alterada com sucesso' });
});

module.exports = router;
