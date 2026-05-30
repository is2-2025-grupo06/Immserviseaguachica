// backend/routes/auth.js
// Registro e inicio de sesión de usuarios públicos del modal de bienvenida

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_en_produccion_2025';

// ─────────────────────────────────────────────
//  POST /api/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { nombre, apellidos, correo, password } = req.body;

  if (!nombre || !apellidos || !correo || !password) {
    return res.status(400).json({ success: false, mensaje: 'Todos los campos son obligatorios.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo.toLowerCase().trim()]
    );
    if (existe.length > 0) {
      return res.status(409).json({ success: false, mensaje: 'Ya existe una cuenta con ese correo.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellidos, correo, password_hash) VALUES (?, ?, ?, ?)',
      [nombre.trim(), apellidos.trim(), correo.toLowerCase().trim(), hash]
    );

    const token = jwt.sign(
      { id: result.insertId, nombre: nombre.trim(), correo: correo.toLowerCase().trim() },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      success: true,
      mensaje: '¡Registro exitoso!',
      token,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      correo: correo.toLowerCase().trim()
    });

  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ success: false, mensaje: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE correo = ? AND activo = 1',
      [correo.toLowerCase().trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, mensaje: 'Correo o contraseña incorrectos.' });
    }

    const usuario = rows[0];
    const valido  = await bcrypt.compare(password, usuario.password_hash);

    if (!valido) {
      return res.status(401).json({ success: false, mensaje: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo
    });

  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
});

module.exports = router;
