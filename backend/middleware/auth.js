// backend/middleware/auth.js
// Middleware de autenticación JWT

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_en_produccion_2025';

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ success: false, error: 'Token de acceso requerido.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario   = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Token inválido o expirado.' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin')
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores.' });
  next();
}

module.exports = { autenticar, soloAdmin };
