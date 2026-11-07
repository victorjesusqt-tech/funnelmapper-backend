-- ============================================================
-- FunnelMapper Pro - Datos Iniciales (Seeds - Etapa 1)
-- ============================================================

USE funnelmapper_db;

-- 1. Usuario administrador inicial (Contraseña: Admin123!)
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Administrador',
  'admin@funnelmapper.local',
  '$2b$12$K/Hezkdi9NFPjWqTAjpBBO7JY4ArV5kO.VPWJ/4X0Jt3mlkw4mncS',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Proyecto de demostración inicial
INSERT INTO projects (user_id, name, description, color, status, is_public)
SELECT id, 'Mi Primer Embudo', 'Proyecto de demostración inicial', '#4A90E2', 'active', 0
FROM users
WHERE email = 'admin@funnelmapper.local'
LIMIT 1;
