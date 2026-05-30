// backend/routes/estadisticas.js
// Métricas y estadísticas del proyecto

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { autenticar } = require('../middleware/auth');

// GET /api/estadisticas — resumen general (público)
router.get('/', async (req, res) => {
  try {
    const [[{ total_lugares }]]  = await db.query('SELECT COUNT(*) AS total_lugares FROM lugares WHERE activo = 1');
    const [[{ total_modelos }]]  = await db.query('SELECT COUNT(*) AS total_modelos FROM modelos_3d WHERE activo = 1');
    const [[{ total_tours }]]    = await db.query('SELECT COUNT(*) AS total_tours FROM tours_360 WHERE activo = 1');
    const [[{ total_mensajes }]] = await db.query('SELECT COUNT(*) AS total_mensajes FROM mensajes_contacto');
    const [[{ total_visitas }]]  = await db.query('SELECT COALESCE(SUM(vistas),0) AS total_visitas FROM estadisticas_modelos');

    res.json({
      success: true,
      data: { total_lugares, total_modelos, total_tours, total_mensajes, total_visitas }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/estadisticas/modelos — top modelos más vistos
router.get('/modelos', autenticar, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM v_top_modelos LIMIT 10');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/estadisticas/visita — registrar visita de página
router.post('/visita', async (req, res) => {
  const { pagina } = req.body;
  const ip         = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent  = req.headers['user-agent'] || '';
  const referrer   = req.headers.referer || '';

  try {
    await db.query(
      'INSERT INTO visitantes (ip_address, user_agent, pagina, referrer) VALUES (?, ?, ?, ?)',
      [ip, userAgent.slice(0, 500), pagina || '/', referrer.slice(0, 500)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
