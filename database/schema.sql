-- ============================================================
-- BASE DE DATOS: Immersive Aguachica
-- Solo registra usuarios del modal de bienvenida
-- ============================================================

CREATE DATABASE IF NOT EXISTS immersive_aguachica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE immersive_aguachica;

-- ============================================================
-- ÚNICA TABLA: usuarios
-- Registra nombre, apellidos, correo y contraseña
-- de quienes se registran desde el modal
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100)  NOT NULL,
  apellidos     VARCHAR(150)  NOT NULL,
  correo        VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  activo        TINYINT(1)    DEFAULT 1,
  creado_en     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);