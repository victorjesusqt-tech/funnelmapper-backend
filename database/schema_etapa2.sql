-- ============================================================
-- FunnelMapper Pro - Schema de Base de Datos (Etapa 2)
-- Estructura de Datos Maestros: Nodos, Embudos, Conexiones y Plantillas
-- Stack: MariaDB / MySQL (XAMPP)
-- ============================================================

USE funnelmapper_db;

-- ------------------------------------------------------------
-- Tabla 1: node_types (Catálogo maestro de tipos de nodos)
-- Define la biblioteca de elementos que se pueden arrastrar al canvas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS node_types (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category       ENUM(
                   'traffic',
                   'page',
                   'action',
                   'email',
                   'social',
                   'ads',
                   'ecommerce',
                   'decision',
                   'other'
                 ) NOT NULL,
  name           VARCHAR(100) NOT NULL,
  slug           VARCHAR(100) NOT NULL UNIQUE,
  description    VARCHAR(300) NULL,
  icon_name      VARCHAR(100) NOT NULL DEFAULT 'default',
  icon_svg       TEXT NULL,
  default_color  VARCHAR(20) NOT NULL DEFAULT '#4A90E2',
  text_color     VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  border_color   VARCHAR(20) NOT NULL DEFAULT '#2C5F8A',
  default_width  FLOAT NOT NULL DEFAULT 160,
  default_height FLOAT NOT NULL DEFAULT 80,
  shape          ENUM('rectangle','rounded','circle','diamond','parallelogram','hexagon') NOT NULL DEFAULT 'rounded',
  can_be_source  TINYINT(1) NOT NULL DEFAULT 1,
  can_be_target  TINYINT(1) NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_slug (slug),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order),
  INDEX idx_category_active_sort (category, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 2: funnels (Embudos dentro de proyectos)
-- Almacena la cabecera y el estado global del canvas de cada embudo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funnels (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  project_id       INT NOT NULL,
  name             VARCHAR(200) NOT NULL,
  description      TEXT NULL,
  canvas_state     LONGTEXT NULL COMMENT 'JSON serializado del estado completo del canvas',
  canvas_width     INT NOT NULL DEFAULT 4000,
  canvas_height    INT NOT NULL DEFAULT 3000,
  zoom_level       FLOAT NOT NULL DEFAULT 1.0,
  pan_x            FLOAT NOT NULL DEFAULT 0,
  pan_y            FLOAT NOT NULL DEFAULT 0,
  bg_color         VARCHAR(20) NOT NULL DEFAULT '#F5F7FA',
  grid_enabled     TINYINT(1) NOT NULL DEFAULT 1,
  grid_size        INT NOT NULL DEFAULT 20,
  snap_to_grid     TINYINT(1) NOT NULL DEFAULT 1,
  node_count       INT NOT NULL DEFAULT 0,
  connection_count INT NOT NULL DEFAULT 0,
  version          INT NOT NULL DEFAULT 1,
  last_saved_at    DATETIME NULL,
  status           ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_last_saved (last_saved_at),
  INDEX idx_project_status (project_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 3: nodes (Instancias de nodos dentro de un embudo)
-- Representa cada bloque colocado en el canvas con su posición y estilo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  funnel_id      INT NOT NULL,
  node_type_id   INT NULL,
  label          VARCHAR(200) NOT NULL,
  sublabel       VARCHAR(200) NULL COMMENT 'Texto secundario o URL de la página',
  pos_x          FLOAT NOT NULL DEFAULT 100,
  pos_y          FLOAT NOT NULL DEFAULT 100,
  width          FLOAT NOT NULL DEFAULT 160,
  height         FLOAT NOT NULL DEFAULT 80,
  color          VARCHAR(20) NOT NULL DEFAULT '#4A90E2',
  text_color     VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  border_color   VARCHAR(20) NOT NULL DEFAULT '#2C5F8A',
  border_width   INT NOT NULL DEFAULT 2,
  border_radius  INT NOT NULL DEFAULT 8,
  opacity        FLOAT NOT NULL DEFAULT 1.0,
  icon_name      VARCHAR(100) NULL,
  icon_url       VARCHAR(500) NULL,
  notes          TEXT NULL,
  custom_data    JSON NULL COMMENT 'Datos adicionales libres del nodo',
  z_index        INT NOT NULL DEFAULT 1,
  is_visible     TINYINT(1) NOT NULL DEFAULT 1,
  is_locked      TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (node_type_id) REFERENCES node_types(id) ON DELETE SET NULL,
  INDEX idx_funnel_id (funnel_id),
  INDEX idx_node_type_id (node_type_id),
  INDEX idx_z_index (z_index),
  INDEX idx_is_visible (is_visible),
  INDEX idx_funnel_z_index (funnel_id, z_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 4: connections (Conexiones y flujos entre nodos)
-- Enlaces direccionales con estilo de línea y puntos de anclaje
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connections (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  funnel_id       INT NOT NULL,
  source_node_id  INT NOT NULL,
  target_node_id  INT NOT NULL,
  label           VARCHAR(150) NULL,
  label_pos       FLOAT NOT NULL DEFAULT 0.5 COMMENT 'Posición del label en la curva (0.0 - 1.0)',
  line_style      ENUM('solid','dashed','dotted') NOT NULL DEFAULT 'solid',
  line_width      INT NOT NULL DEFAULT 2,
  arrow_style     ENUM('arrow','hollow','circle','none') NOT NULL DEFAULT 'arrow',
  color           VARCHAR(20) NOT NULL DEFAULT '#94A3B8',
  curve_type      ENUM('straight','bezier','step','smooth') NOT NULL DEFAULT 'bezier',
  source_anchor   ENUM('top','right','bottom','left','auto') NOT NULL DEFAULT 'auto',
  target_anchor   ENUM('top','right','bottom','left','auto') NOT NULL DEFAULT 'auto',
  control_point_x FLOAT NULL COMMENT 'Punto de control Bezier (offset X)',
  control_point_y FLOAT NULL COMMENT 'Punto de control Bezier (offset Y)',
  animated        TINYINT(1) NOT NULL DEFAULT 0,
  is_visible      TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  INDEX idx_funnel_id (funnel_id),
  INDEX idx_source_node (source_node_id),
  INDEX idx_target_node (target_node_id),
  INDEX idx_funnel_source_target (funnel_id, source_node_id, target_node_id),
  UNIQUE KEY unique_connection (source_node_id, target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 5: templates (Plantillas predefinidas y públicas de embudos)
-- Contiene diagramas prediseñados listos para clonarse en proyectos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templates (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  category     ENUM(
                 'lead_generation',
                 'ecommerce',
                 'webinar',
                 'saas',
                 'affiliate',
                 'local_business',
                 'consulting',
                 'course',
                 'custom'
               ) NOT NULL DEFAULT 'custom',
  description  TEXT NULL,
  thumbnail    VARCHAR(500) NULL,
  preview_img  VARCHAR(500) NULL,
  canvas_data  LONGTEXT NOT NULL COMMENT 'JSON con nodos y conexiones de la plantilla',
  node_count   INT NOT NULL DEFAULT 0,
  is_public    TINYINT(1) NOT NULL DEFAULT 1,
  is_featured  TINYINT(1) NOT NULL DEFAULT 0,
  created_by   INT NULL,
  downloads    INT NOT NULL DEFAULT 0,
  rating       FLOAT NULL DEFAULT 0,
  tags         JSON NULL COMMENT 'Array de etiquetas para búsqueda',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_is_public (is_public),
  INDEX idx_is_featured (is_featured),
  INDEX idx_downloads (downloads),
  FULLTEXT INDEX ft_templates_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla 6: funnel_versions (Historial de versiones y snapshots)
-- Permite guardar puntos de restauración del canvas para auditoría y rollback
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funnel_versions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  funnel_id    INT NOT NULL,
  version      INT NOT NULL,
  canvas_state LONGTEXT NOT NULL,
  node_count   INT NOT NULL DEFAULT 0,
  saved_by     INT NULL,
  saved_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes        VARCHAR(300) NULL COMMENT 'Descripción opcional del guardado',
  FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
  FOREIGN KEY (saved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_funnel_id (funnel_id),
  INDEX idx_version (version),
  UNIQUE KEY unique_funnel_version (funnel_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
