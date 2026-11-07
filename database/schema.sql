-- ============================================================
-- FunnelMapper Pro - Schema de Base de Datos (Etapa 1)
-- Stack: MariaDB / MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS funnelmapper_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE funnelmapper_db;

-- ------------------------------------------------------------
-- Tabla: users
-- Gestiona cuentas de usuario, roles y credenciales
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','editor','viewer') NOT NULL DEFAULT 'editor',
  avatar_url    VARCHAR(500) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login    DATETIME NULL,
  refresh_token VARCHAR(500) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: projects
-- Almacena los proyectos de embudos pertenecientes a cada usuario
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  name         VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  thumbnail    VARCHAR(500) NULL,
  color        VARCHAR(20) NOT NULL DEFAULT '#4A90E2',
  is_public    TINYINT(1) NOT NULL DEFAULT 0,
  status       ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  funnel_count INT NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: refresh_tokens
-- Control de sesiones y revocación de tokens JWT
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(300) NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: activity_logs
-- Registro de auditoría para acciones críticas de seguridad y proyectos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  project_id  INT NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id   INT NULL,
  details     JSON NULL,
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(300) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
