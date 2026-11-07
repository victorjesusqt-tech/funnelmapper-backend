-- ============================================================
-- FunnelMapper Pro - Semillas de Plantillas Predefinidas (Etapa 2)
-- Catálogo con 10 plantillas de embudos populares con nodos y conexiones serializados
-- Stack: MariaDB / MySQL (XAMPP)
-- ============================================================

USE funnelmapper_db;

-- ------------------------------------------------------------
-- Template 1: Captura de Leads Simple
-- Categoría: lead_generation (5 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Captura de Leads Simple',
  'lead-capture-simple',
  'lead_generation',
  'Embudo básico de dos pasos para captura de correos electrónicos mediante un lead magnet o recurso descargable.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','facebook-ads','label','Facebook Ads','pos_x',100,'pos_y',200),
      JSON_OBJECT('tempId','n2','node_type_slug','google-ads','label','Google Ads','pos_x',100,'pos_y',350),
      JSON_OBJECT('tempId','n3','node_type_slug','squeeze-page','label','Squeeze Page','pos_x',350,'pos_y',275),
      JSON_OBJECT('tempId','n4','node_type_slug','thank-you-page','label','Thank You Page','pos_x',600,'pos_y',275),
      JSON_OBJECT('tempId','n5','node_type_slug','email-sequence','label','Secuencia Email (7 días)','pos_x',850,'pos_y',275)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5')
    )
  ),
  5, 1, 1, 142, 4.9,
  JSON_ARRAY('leads', 'email', 'basico', 'captura')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 2: Embudo de Ventas con Upsell
-- Categoría: ecommerce (8 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Embudo de Ventas con Upsell',
  'sales-funnel-upsell',
  'ecommerce',
  'Embudo completo de ventas directas: fuentes de tráfico, landing, carta de venta, checkout, upsell (OTO) y downsell.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','google-ads','label','Google Ads','pos_x',50,'pos_y',200),
      JSON_OBJECT('tempId','n2','node_type_slug','facebook-ads','label','FB Ads','pos_x',50,'pos_y',350),
      JSON_OBJECT('tempId','n3','node_type_slug','landing-page','label','Landing Page','pos_x',300,'pos_y',275),
      JSON_OBJECT('tempId','n4','node_type_slug','sales-page','label','Sales Page','pos_x',550,'pos_y',275),
      JSON_OBJECT('tempId','n5','node_type_slug','checkout-page','label','Checkout','pos_x',800,'pos_y',275),
      JSON_OBJECT('tempId','n6','node_type_slug','upsell-page','label','Upsell OTO1','pos_x',1050,'pos_y',175),
      JSON_OBJECT('tempId','n7','node_type_slug','downsell-page','label','Downsell','pos_x',1050,'pos_y',375),
      JSON_OBJECT('tempId','n8','node_type_slug','thank-you-page','label','Thank You','pos_x',1300,'pos_y',275)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5'),
      JSON_OBJECT('source','n5','target','n6'),
      JSON_OBJECT('source','n6','target','n8','label','Acepta'),
      JSON_OBJECT('source','n6','target','n7','label','Rechaza'),
      JSON_OBJECT('source','n7','target','n8')
    )
  ),
  8, 1, 1, 230, 4.8,
  JSON_ARRAY('ventas', 'upsell', 'ecommerce', 'checkout', 'downsell')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 3: Embudo de Webinar Automatizado (Evergreen)
-- Categoría: webinar (7 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Webinar Evergreen Automatizado',
  'webinar-funnel-evergreen',
  'webinar',
  'Flujo continuo para captación de asistentes, recordatorios automáticos por correo, sala de transmisión VSL y llamada a checkout.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','facebook-ads','label','Facebook Ads','pos_x',60,'pos_y',200),
      JSON_OBJECT('tempId','n2','node_type_slug','youtube-ads','label','YouTube Ads','pos_x',60,'pos_y',350),
      JSON_OBJECT('tempId','n3','node_type_slug','webinar-page','label','Registro al Webinar','pos_x',320,'pos_y',275),
      JSON_OBJECT('tempId','n4','node_type_slug','thank-you-page','label','Confirmación y Enlace','pos_x',580,'pos_y',275),
      JSON_OBJECT('tempId','n5','node_type_slug','email-sequence','label','Recordatorios Email','pos_x',840,'pos_y',180),
      JSON_OBJECT('tempId','n6','node_type_slug','vsl-page','label','Sala Webinar / VSL','pos_x',840,'pos_y',360),
      JSON_OBJECT('tempId','n7','node_type_slug','checkout-page','label','Checkout Especial','pos_x',1100,'pos_y',360)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5'),
      JSON_OBJECT('source','n4','target','n6'),
      JSON_OBJECT('source','n5','target','n6'),
      JSON_OBJECT('source','n6','target','n7','label','Oferta Lanzada')
    )
  ),
  7, 1, 1, 185, 4.9,
  JSON_ARRAY('webinar', 'evergreen', 'automatizacion', 'ventas')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 4: Embudo SaaS Free Trial a Pago
-- Categoría: saas (7 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'SaaS Free Trial a Suscripción',
  'saas-free-trial-conversion',
  'saas',
  'Embudo orientado a captación B2B para plataformas software: prueba gratuita de 14 días, onboarding guiado y conversión a plan Pro.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','google-ads','label','Google Ads Search','pos_x',80,'pos_y',180),
      JSON_OBJECT('tempId','n2','node_type_slug','seo-organic','label','SEO y Blog Post','pos_x',80,'pos_y',340),
      JSON_OBJECT('tempId','n3','node_type_slug','landing-page','label','Página Producto SaaS','pos_x',340,'pos_y',260),
      JSON_OBJECT('tempId','n4','node_type_slug','form','label','Registro Free Trial','pos_x',600,'pos_y',260),
      JSON_OBJECT('tempId','n5','node_type_slug','autoresponder','label','Bienvenida y Credenciales','pos_x',860,'pos_y',160),
      JSON_OBJECT('tempId','n6','node_type_slug','email-sequence','label','Onboarding de 14 Días','pos_x',860,'pos_y',360),
      JSON_OBJECT('tempId','n7','node_type_slug','checkout-page','label','Suscripción Plan Pro','pos_x',1120,'pos_y',260)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5'),
      JSON_OBJECT('source','n4','target','n6'),
      JSON_OBJECT('source','n6','target','n7','label','Fin del Trial')
    )
  ),
  7, 1, 0, 98, 4.7,
  JSON_ARRAY('saas', 'software', 'free trial', 'b2b', 'suscripcion')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 5: Embudo Lanzamiento Fórmula de Curso
-- Categoría: course (8 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Lanzamiento de Curso Online',
  'course-launch-formula',
  'course',
  'Estructura de prelanzamiento y apertura de puertas para academias digitales e infoproductores con mentoría VIP complementaria.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','facebook-ads','label','Tráfico Lanzamiento','pos_x',60,'pos_y',250),
      JSON_OBJECT('tempId','n2','node_type_slug','squeeze-page','label','Captura Taller Gratis','pos_x',300,'pos_y',250),
      JSON_OBJECT('tempId','n3','node_type_slug','email-sequence','label','Cadencia 4 Clases','pos_x',550,'pos_y',250),
      JSON_OBJECT('tempId','n4','node_type_slug','vsl-page','label','Clase 4 - Venta y Oferta','pos_x',800,'pos_y',250),
      JSON_OBJECT('tempId','n5','node_type_slug','sales-page','label','Página Matrícula Oficial','pos_x',1050,'pos_y',250),
      JSON_OBJECT('tempId','n6','node_type_slug','checkout-page','label','Pasarela Checkout','pos_x',1300,'pos_y',250),
      JSON_OBJECT('tempId','n7','node_type_slug','upsell-page','label','Mentoría VIP (OTO)','pos_x',1550,'pos_y',170),
      JSON_OBJECT('tempId','n8','node_type_slug','thank-you-page','label','Bienvenida a la Comunidad','pos_x',1800,'pos_y',250)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n2'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5'),
      JSON_OBJECT('source','n5','target','n6'),
      JSON_OBJECT('source','n6','target','n7'),
      JSON_OBJECT('source','n7','target','n8')
    )
  ),
  8, 1, 1, 160, 4.9,
  JSON_ARRAY('curso', 'infoproducto', 'lanzamiento', 'educacion')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 6: Embudo de Consultoría High-Ticket
-- Categoría: consulting (6 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Consultoría y Servicios High-Ticket',
  'high-ticket-consulting',
  'consulting',
  'Filtro de prospección cualificada con formulario de admisión y agendamiento directo de sesión estratégica de diagnóstico.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','linkedin-ads','label','LinkedIn Ads Directivo','pos_x',80,'pos_y',200),
      JSON_OBJECT('tempId','n2','node_type_slug','direct-traffic','label','Prospección Outbound','pos_x',80,'pos_y',350),
      JSON_OBJECT('tempId','n3','node_type_slug','vsl-page','label','Caso de Estudio VSL','pos_x',350,'pos_y',275),
      JSON_OBJECT('tempId','n4','node_type_slug','form','label','Formulario Cualificación','pos_x',620,'pos_y',275),
      JSON_OBJECT('tempId','n5','node_type_slug','cta','label','Calendario de Citas','pos_x',890,'pos_y',275),
      JSON_OBJECT('tempId','n6','node_type_slug','thank-you-page','label','Instrucciones de la Llamada','pos_x',1150,'pos_y',275)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4','label','Aplica al programa'),
      JSON_OBJECT('source','n4','target','n5','label','Pasa el filtro'),
      JSON_OBJECT('source','n5','target','n6')
    )
  ),
  6, 1, 0, 115, 4.8,
  JSON_ARRAY('consultoria', 'high-ticket', 'b2b', 'agendamiento', 'llamada')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 7: Embudo para Negocio Local y Reserva de Citas
-- Categoría: local_business (5 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Reserva de Citas para Negocio Local',
  'local-business-booking',
  'local_business',
  'Atracción de clientes locales con oferta de bienvenida, formulario de cita y confirmaciones automáticas por SMS.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','google-ads','label','Google Ads Búsqueda Local','pos_x',80,'pos_y',200),
      JSON_OBJECT('tempId','n2','node_type_slug','instagram-ads','label','Instagram Geosegmentado','pos_x',80,'pos_y',350),
      JSON_OBJECT('tempId','n3','node_type_slug','landing-page','label','Cupón 1ra Visita','pos_x',350,'pos_y',275),
      JSON_OBJECT('tempId','n4','node_type_slug','form','label','Formulario Reserva','pos_x',620,'pos_y',275),
      JSON_OBJECT('tempId','n5','node_type_slug','sms-marketing','label','Confirmación SMS y WhatsApp','pos_x',890,'pos_y',275)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n3'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n4','target','n5')
    )
  ),
  5, 1, 0, 88, 4.6,
  JSON_ARRAY('negocio local', 'citas', 'servicios', 'geolocalizado', 'sms')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 8: Embudo de Afiliados (Bridge Page)
-- Categoría: affiliate (5 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Embudo de Afiliados con Bridge Page',
  'affiliate-bridge-funnel',
  'affiliate',
  'Estrategia de afiliación ética: captación de lista propia, entrega de lead magnet y puente de confianza con bonos antes de derivar a la oferta del productor.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','tiktok-ads','label','TikTok Ads / Orgánico','pos_x',80,'pos_y',260),
      JSON_OBJECT('tempId','n2','node_type_slug','squeeze-page','label','Optin Guía Gratuita','pos_x',340,'pos_y',260),
      JSON_OBJECT('tempId','n3','node_type_slug','download','label','Descarga del Recurso','pos_x',600,'pos_y',160),
      JSON_OBJECT('tempId','n4','node_type_slug','vsl-page','label','Bridge Page con Bonos','pos_x',600,'pos_y',360),
      JSON_OBJECT('tempId','n5','node_type_slug','cta','label','Link de Afiliado Externo','pos_x',880,'pos_y',360)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n2'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n2','target','n4'),
      JSON_OBJECT('source','n4','target','n5','label','Comprar con Bono')
    )
  ),
  5, 1, 0, 72, 4.5,
  JSON_ARRAY('afiliados', 'bridge page', 'comisiones', 'tiktok', 'bonos')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 9: Recuperación de Carritos Abandonados
-- Categoría: ecommerce (6 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Recuperación de Carritos Abandonados',
  'cart-abandonment-recovery',
  'ecommerce',
  'Flujo automatizado para tiendas online que detecta carritos sin finalizar y lanza recordatorios con incentivos de descuento.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','checkout-page','label','Carrito en Checkout','pos_x',80,'pos_y',250),
      JSON_OBJECT('tempId','n2','node_type_slug','abandonment','label','Evento Abandono','pos_x',340,'pos_y',250),
      JSON_OBJECT('tempId','n3','node_type_slug','email-sequence','label','Email 1: ¿Olvidaste algo? (1h)','pos_x',600,'pos_y',150),
      JSON_OBJECT('tempId','n4','node_type_slug','email-sequence','label','Email 2: Cupón 10% Descuento (24h)','pos_x',600,'pos_y',350),
      JSON_OBJECT('tempId','n5','node_type_slug','checkout-page','label','Regreso al Checkout con Cupón','pos_x',880,'pos_y',250),
      JSON_OBJECT('tempId','n6','node_type_slug','purchase','label','Compra Completada','pos_x',1140,'pos_y',250)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n2'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n2','target','n4'),
      JSON_OBJECT('source','n3','target','n5'),
      JSON_OBJECT('source','n4','target','n5'),
      JSON_OBJECT('source','n5','target','n6')
    )
  ),
  6, 1, 1, 195, 4.9,
  JSON_ARRAY('ecommerce', 'abandono', 'recuperacion', 'email', 'descuento')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);

-- ------------------------------------------------------------
-- Template 10: Embudo Tripwire de Oferta Irresistible
-- Categoría: lead_generation (7 nodos)
-- ------------------------------------------------------------
INSERT INTO templates (name, slug, category, description, canvas_data, node_count, is_public, is_featured, downloads, rating, tags)
VALUES
(
  'Embudo Tripwire de Oferta Irresistible',
  'tripwire-funnel',
  'lead_generation',
  'Estrategia de auto-liquidación de tráfico: imán de prospectos seguido inmediatamente de micro-oferta ($7-$19) con order bump y upsell.',
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('tempId','n1','node_type_slug','facebook-ads','label','Facebook Ads Tráfico Frío','pos_x',80,'pos_y',260),
      JSON_OBJECT('tempId','n2','node_type_slug','squeeze-page','label','Registro Lead Magnet Gratis','pos_x',340,'pos_y',260),
      JSON_OBJECT('tempId','n3','node_type_slug','sales-page','label','Oferta Tripwire ($9)','pos_x',600,'pos_y',260),
      JSON_OBJECT('tempId','n4','node_type_slug','order-bump','label','Order Bump Complementario ($17)','pos_x',860,'pos_y',160),
      JSON_OBJECT('tempId','n5','node_type_slug','upsell-page','label','Upsell Programa Completo ($97)','pos_x',860,'pos_y',360),
      JSON_OBJECT('tempId','n6','node_type_slug','thank-you-page','label','Descarga y Acceso a la Plataforma','pos_x',1120,'pos_y',260),
      JSON_OBJECT('tempId','n7','node_type_slug','email-sequence','label','Secuencia de Nutrición de Clientes','pos_x',1380,'pos_y',260)
    ),
    'connections', JSON_ARRAY(
      JSON_OBJECT('source','n1','target','n2'),
      JSON_OBJECT('source','n2','target','n3'),
      JSON_OBJECT('source','n3','target','n4'),
      JSON_OBJECT('source','n3','target','n5'),
      JSON_OBJECT('source','n4','target','n6'),
      JSON_OBJECT('source','n5','target','n6'),
      JSON_OBJECT('source','n6','target','n7')
    )
  ),
  7, 1, 1, 140, 4.8,
  JSON_ARRAY('tripwire', 'lead magnet', 'upsell', 'autoliquidacion', 'ventas')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  canvas_data = VALUES(canvas_data),
  node_count = VALUES(node_count),
  is_public = VALUES(is_public),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags);
