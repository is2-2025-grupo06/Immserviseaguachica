// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'immersive_aguachica',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset: 'utf8mb4'
});

// Verificar conexión al iniciar (sin matar el servidor si falla)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    conn.release();
  } catch (err) {
    console.error('⚠️  MySQL no disponible:', err.message);
    console.error('   El servidor sigue activo pero las rutas de BD devolverán error.');
    console.error('   Verifica tu archivo .env y que MySQL esté corriendo.\n');
    // NO llamamos process.exit(1) — el servidor sigue sirviendo el HTML
  }
})();

module.exports = pool;
