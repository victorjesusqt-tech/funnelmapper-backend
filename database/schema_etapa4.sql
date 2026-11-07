-- ============================================================
-- FunnelMapper Pro - Schema de Base de Datos (Etapa 4)
-- Métricas, Analítica, Objetivos, Exportación y Enlaces Públicos
-- Stack: MariaDB / MySQL (XAMPP)
-- ============================================================

USE funnelmapper_db;

-- ------------------------------------------------------------
-- Tabla 1: metrics (Métricas cuantitativas e históricas por nodo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metrics (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  node_id         INT NOT NULL,
  funnel_id       INT NOT NULL,
  metric_date     DATE NOT NULL,
  period_type     ENUM('day','week','month') NOT NULL DEFAULT 'day',
  visitors        INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  clicks          INT NOT NULL DEFAULT 0,
  conversions     INT NOT NULL DEFAULT 0,
  revenue         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  cost            DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  bounce_rate     FLOAT NOT NULL DEFAULT 0 COMMENT 'Porcentaje 0-100',
  avg_time_sec    INT NOT NULL DEFAULT 0,
  conversion_rate FLOAT GENERATED ALWAYS AS
                  (IF(visitors > 0, (conversions / visitors) * 100, 0))
                  STORED COMMENT 'Calculado automáticamente',
  roi             FLOAT GENERATED ALWAYS AS
                  (IF(cost > 0, ((revenue - cost) / cost) * 100, 0))
                  STORED COMMENT 'ROI calculado automáticamente',
  roas            FLOAT GENERATED ALWAYS AS
                  (IF(cost > 0, revenue / cost, 0))
                  STORED COMMENT 'ROAS calculado automáticamente',
  custom_kpis     JSON NULL COMMENT 'KPIs adicionales definidos por el usuario',
  source          ENUM('manual','csv_import','api') NOT NULL DEFAULT 'manual',
  notes           VARCHAR(300) NULL,
  created_by      INT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_node_date_period (node_id, metric_date, period_type),
  INDEX idx_funnel_id (funnel_id),
  INDEX idx_node_id (node_id),
  INDEX idx_metric_date (metric_date),
  INDEX idx_period_type (period_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 2: metric_goals (Objetivos y metas de rendimiento por nodo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metric_goals (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  node_id          INT NOT NULL,
  funnel_id        INT NOT NULL,
  goal_visitors    INT NULL COMMENT 'Objetivo de visitantes',
  goal_conversions INT NULL COMMENT 'Objetivo de conversiones',
  goal_revenue     DECIMAL(14,2) NULL COMMENT 'Objetivo de ingresos',
  goal_conv_rate   FLOAT NULL COMMENT 'Objetivo de tasa de conversión (%)',
  goal_roas        FLOAT NULL COMMENT 'Objetivo de ROAS',
  period           ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'monthly',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  UNIQUE KEY unique_node_goal_period (node_id, period),
  INDEX idx_goal_funnel (funnel_id),
  INDEX idx_goal_node (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 3: exports (Registro y seguimiento de exportaciones)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  funnel_id    INT NOT NULL,
  user_id      INT NOT NULL,
  format       ENUM('png','pdf','json','csv') NOT NULL,
  file_path    VARCHAR(500) NULL,
  file_size    INT NULL COMMENT 'Tamaño en bytes',
  status       ENUM('pending','processing','done','error') NOT NULL DEFAULT 'pending',
  error_msg    VARCHAR(300) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_funnel_id (funnel_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 4: public_shares (Enlaces públicos compartibles para vista)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_shares (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  funnel_id    INT NOT NULL,
  user_id      INT NOT NULL,
  token        VARCHAR(64) NOT NULL UNIQUE COMMENT 'Token único de acceso público',
  expires_at   DATETIME NULL COMMENT 'NULL = sin expiración',
  view_count   INT NOT NULL DEFAULT 0,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  show_metrics TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Mostrar métricas al ver públicamente',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_funnel_id (funnel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

