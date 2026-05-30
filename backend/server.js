const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db         = require('./config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_2025';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ══ POST /api/register ══
app.post('/api/register', async (req, res) => {
  console.log('[REGISTER] Body:', req.body);
  const { nombre, apellidos, correo, password } = req.body;
  if (!nombre || !apellidos || !correo || !password)
    return res.status(400).json({ success: false, mensaje: 'Todos los campos son obligatorios.' });
  if (password.length < 8)
    return res.status(400).json({ success: false, mensaje: 'La contrasena debe tener al menos 8 caracteres.' });
  try {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE correo = ?', [correo.toLowerCase().trim()]);
    if (existe.length > 0)
      return res.status(409).json({ success: false, mensaje: 'Ya existe una cuenta con ese correo.' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, apellidos, correo, password_hash) VALUES (?, ?, ?, ?)',
      [nombre.trim(), apellidos.trim(), correo.toLowerCase().trim(), hash]
    );
    const token = jwt.sign({ id: result.insertId, nombre: nombre.trim(), correo: correo.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '8h' });
    console.log('[REGISTER] OK:', correo);
    return res.status(201).json({ success: true, mensaje: 'Registro exitoso', token, nombre: nombre.trim(), apellidos: apellidos.trim(), correo: correo.toLowerCase().trim() });
  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    return res.status(500).json({ success: false, mensaje: 'Error: ' + err.message });
  }
});

// ══ POST /api/login ══
app.post('/api/login', async (req, res) => {
  console.log('[LOGIN] Body:', req.body);
  const { correo, password } = req.body;
  if (!correo || !password)
    return res.status(400).json({ success: false, mensaje: 'Correo y contrasena obligatorios.' });
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ? AND activo = 1', [correo.toLowerCase().trim()]);
    if (!rows.length)
      return res.status(401).json({ success: false, mensaje: 'Correo o contrasena incorrectos.' });
    const usuario = rows[0];
    const valido  = await bcrypt.compare(password, usuario.password_hash);
    if (!valido)
      return res.status(401).json({ success: false, mensaje: 'Correo o contrasena incorrectos.' });
    const token = jwt.sign({ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo }, JWT_SECRET, { expiresIn: '8h' });
    console.log('[LOGIN] OK:', correo);
    return res.json({ success: true, token, nombre: usuario.nombre, apellidos: usuario.apellidos, correo: usuario.correo });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    return res.status(500).json({ success: false, mensaje: 'Error: ' + err.message });
  }
});

// ══ GET /api/test — confirma que este servidor esta corriendo ══
app.get('/api/test', (req, res) => {
  res.json({ ok: true, version: 2, mensaje: 'Servidor correcto activo' });
});

// ══ GET /api/health ══
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ══ Otras rutas API ══
const lugaresRoutes  = require('./routes/lugares');
const modelosRoutes  = require('./routes/modelos');
const contactoRoutes = require('./routes/contacto');
const statsRoutes    = require('./routes/estadisticas');
const adminRoutes    = require('./routes/admin');
app.use('/api/lugares',      lugaresRoutes);
app.use('/api/modelos',      modelosRoutes);
app.use('/api/contacto',     contactoRoutes);
app.use('/api/estadisticas', statsRoutes);
app.use('/api/admin',        adminRoutes);

// ══ Archivos estaticos AL FINAL ══
app.use(express.static(path.join(__dirname, '..')));

// Fallback Express 5
app.get('{*path}', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, mensaje: err.message });
});

app.listen(PORT, () => {
  console.log('\n OK - Servidor corriendo en http://localhost:' + PORT + '\n');
});
