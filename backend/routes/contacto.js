// backend/routes/contacto.js
// Formulario de contacto

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { autenticar } = require('../middleware/auth');

// Validación básica
function validarMensaje({ nombre, correo, mensaje }) {
  const errores = [];
  if (!nombre  || nombre.trim().length < 2)   errores.push('El nombre es requerido (mín. 2 caracteres).');
  if (!correo  || !/\S+@\S+\.\S+/.test(correo)) errores.push('El correo electrónico no es válido.');
  if (!mensaje || mensaje.trim().length < 10)  errores.push('El mensaje debe tener al menos 10 caracteres.');
  return errores;
}

// POST /api/contacto — recibir mensaje del formulario
router.post('/', async (req, res) => {
  const { nombre, correo, mensaje } = req.body;
  const errores = validarMensaje({ nombre, correo, mensaje });
  if (errores.length) return res.status(400).json({ success: false, errores });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await db.query(
      'INSERT INTO mensajes_contacto (nombre, correo, mensaje, ip_address) VALUES (?, ?, ?, ?)',
      [nombre.trim(), correo.trim().toLowerCase(), mensaje.trim(), ip]
    );
    res.status(201).json({
      success: true,
      message: '¡Mensaje recibido! Te responderemos pronto.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al guardar el mensaje.' });
  }
});

// GET /api/contacto — listar mensajes (solo admin)
router.get('/', autenticar, async (req, res) => {
  const { leido } = req.query;
  try {
    let query = 'SELECT * FROM mensajes_contacto';
    const params = [];
    if (leido !== undefined) {
      query += ' WHERE leido = ?';
      params.push(parseInt(leido));
    }
    query += ' ORDER BY enviado_en DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/contacto/:id/leido — marcar como leído (solo admin)
router.patch('/:id/leido', autenticar, async (req, res) => {
  try {
    await db.query('UPDATE mensajes_contacto SET leido = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
