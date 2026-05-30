// backend/routes/modelos.js
// Gestión de modelos 3D

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { autenticar } = require('../middleware/auth');

// GET /api/modelos — todos los modelos activos (con lugar)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, l.nombre AS lugar_nombre, l.slug AS lugar_slug
      FROM modelos_3d m
      JOIN lugares l ON l.id = m.lugar_id
      WHERE m.activo = 1
      ORDER BY m.orden ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/modelos/destacados — solo modelos destacados
router.get('/destacados', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, l.nombre AS lugar_nombre
      FROM modelos_3d m
      JOIN lugares l ON l.id = m.lugar_id
      WHERE m.activo = 1 AND m.destacado = 1
      ORDER BY m.orden ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/modelos/:id — detalle de un modelo
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, l.nombre AS lugar_nombre, l.slug AS lugar_slug
       FROM modelos_3d m
       JOIN lugares l ON l.id = m.lugar_id
       WHERE m.id = ? AND m.activo = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Modelo no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/modelos/:id/vista — registrar una visualización
router.post('/:id/vista', async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0];
  try {
    await db.query(`
      INSERT INTO estadisticas_modelos (modelo_id, fecha, vistas)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE vistas = vistas + 1
    `, [req.params.id, hoy]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/modelos — crear modelo (solo admin)
router.post('/', autenticar, async (req, res) => {
  const { lugar_id, nombre, archivo_glb, descripcion,
          tipo, software, version_blender, peso_mb, poligonos, destacado, orden } = req.body;
  try {
    const [result] = await db.query(`
      INSERT INTO modelos_3d
      (lugar_id, nombre, archivo_glb, descripcion, tipo, software, version_blender, peso_mb, poligonos, destacado, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [lugar_id, nombre, archivo_glb, descripcion, tipo,
        software || 'Blender', version_blender, peso_mb, poligonos,
        destacado || 0, orden || 0]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/modelos/:id — actualizar modelo (solo admin)
router.put('/:id', autenticar, async (req, res) => {
  const campos = req.body;
  const sets   = Object.keys(campos).map(k => `${k} = ?`).join(', ');
  try {
    await db.query(
      `UPDATE modelos_3d SET ${sets} WHERE id = ?`,
      [...Object.values(campos), req.params.id]
    );
    res.json({ success: true, message: 'Modelo actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
