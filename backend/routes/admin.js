// backend/routes/admin.js
// Autenticación del panel de administración

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const { autenticar } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_en_produccion_2025';

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password)
    return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios_admin WHERE correo = ? AND activo = 1',
      [correo.toLowerCase()]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });

    const usuario = rows[0];
    const valido  = await bcrypt.compare(password, usuario.password_hash);
    if (!valido)
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });

    // Actualizar último acceso
    await db.query('UPDATE usuarios_admin SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/perfil — perfil del admin autenticado
router.get('/perfil', autenticar, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, rol, ultimo_acceso, creado_en FROM usuarios_admin WHERE id = ?',
      [req.usuario.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/cambiar-password
router.post('/cambiar-password', autenticar, async (req, res) => {
  const { password_actual, password_nueva } = req.body;
  if (!password_actual || !password_nueva || password_nueva.length < 8)
    return res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' });

  try {
    const [rows] = await db.query('SELECT password_hash FROM usuarios_admin WHERE id = ?', [req.usuario.id]);
    const valido = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valido)
      return res.status(401).json({ success: false, error: 'Contraseña actual incorrecta.' });

    const nuevoHash = await bcrypt.hash(password_nueva, 10);
    await db.query('UPDATE usuarios_admin SET password_hash = ? WHERE id = ?', [nuevoHash, req.usuario.id]);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
