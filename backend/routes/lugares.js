// backend/routes/lugares.js
// CRUD de lugares turísticos

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { autenticar } = require('../middleware/auth');

// GET /api/lugares — lista todos los lugares activos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM v_lugares_resumen WHERE activo = 1 ORDER BY orden ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/lugares/:slug — detalle de un lugar
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM lugares WHERE slug = ? AND activo = 1',
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Lugar no encontrado' });

    // Modelos 3D del lugar
    const [modelos] = await db.query(
      'SELECT * FROM modelos_3d WHERE lugar_id = ? AND activo = 1 ORDER BY orden',
      [rows[0].id]
    );

    // Tours 360 del lugar
    const [tours] = await db.query(
      'SELECT * FROM tours_360 WHERE lugar_id = ? AND activo = 1',
      [rows[0].id]
    );

    res.json({ success: true, data: { ...rows[0], modelos, tours } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/lugares — crear lugar (solo admin)
router.post('/', autenticar, async (req, res) => {
  const { slug, nombre, categoria, descripcion, descripcion_corta,
          direccion, latitud, longitud, imagen_principal, orden } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO lugares
       (slug, nombre, categoria, descripcion, descripcion_corta, direccion, latitud, longitud, imagen_principal, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, nombre, categoria, descripcion, descripcion_corta,
       direccion, latitud, longitud, imagen_principal, orden || 0]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/lugares/:id — actualizar lugar (solo admin)
router.put('/:id', autenticar, async (req, res) => {
  const campos = req.body;
  const sets   = Object.keys(campos).map(k => `${k} = ?`).join(', ');
  try {
    await db.query(
      `UPDATE lugares SET ${sets} WHERE id = ?`,
      [...Object.values(campos), req.params.id]
    );
    res.json({ success: true, message: 'Lugar actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/lugares/:id — desactivar lugar (soft delete)
router.delete('/:id', autenticar, async (req, res) => {
  try {
    await db.query('UPDATE lugares SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Lugar desactivado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
