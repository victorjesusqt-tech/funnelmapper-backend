-- ============================================================
-- FunnelMapper Pro - Semillas de Tipos de Nodos (Etapa 2)
-- Catálogo maestro con 38 tipos de nodos de marketing organizados por categoría
-- Stack: MariaDB / MySQL (XAMPP)
-- ============================================================

USE funnelmapper_db;

-- ------------------------------------------------------------
-- 1. Categoría: Tráfico (Traffic Sources)
-- ------------------------------------------------------------
INSERT INTO node_types (category, name, slug, description, icon_name, icon_svg, default_color, border_color, shape, sort_order)
VALUES
('traffic', 'Facebook',            'facebook',           'Tráfico y comunidad orgánica desde Facebook',                     'soc_facebook',  'assets/icons/soc_facebook.svg',  '#1877F2', '#0D5BA8', 'rounded', 5),
('traffic', 'Instagram',           'instagram',          'Tráfico orgánico desde perfil, reels y stories de Instagram',     'soc_instagram', 'assets/icons/soc_instagram.svg', '#E1306C', '#9B1B47', 'rounded', 6),
('traffic', 'TikTok',              'tiktok',             'Canal de tráfico orgánico y perfil TikTok',                       'soc_tiktok',    'assets/icons/soc_tiktok.svg',    '#010101', '#333333', 'rounded', 7),
('traffic', 'YouTube',             'youtube',            'Tráfico orgánico desde canal de vídeos de YouTube',               'soc_youtube',   'assets/icons/soc_youtube.svg',   '#FF0000', '#CC0000', 'rounded', 8),
('traffic', 'WhatsApp',            'whatsapp',           'Tráfico y mensajería directa por WhatsApp',                       'soc_whatsapp',  'assets/icons/soc_whatsapp.svg',  '#25D366', '#128C7E', 'rounded', 9),
('traffic', 'Jobsite',             'traf-jobsite',       'Portal de empleo o bolsa de trabajo',                             'traf_jobsite',  'assets/icons/traf_jobsite.svg',  '#2563EB', '#1D4ED8', 'rounded', 10),
('traffic', 'TV Ad',               'traf-tvad',          'Publicidad en televisión o streaming',                            'traf_tvad',     'assets/icons/traf_tvad.svg',     '#6366F1', '#4F46E5', 'rounded', 11),
('traffic', 'Google Ads',          'google-ads',         'Tráfico de pago desde Google Search / Display / Performance Max', 'google-ads',    NULL,                             '#4285F4', '#2557A7', 'rounded', 12),
('traffic', 'Facebook Ads',        'facebook-ads',       'Anuncios de pago en Facebook e Instagram Feed/Stories',           'facebook-ads',  NULL,                             '#1877F2', '#0D5BA8', 'rounded', 13),
('traffic', 'Instagram Ads',       'instagram-ads',      'Anuncios nativos en Instagram Stories y Reels',                   'instagram-ads', NULL,                             '#E1306C', '#9B1B47', 'rounded', 14),
('traffic', 'TikTok Ads',          'tiktok-ads',         'Anuncios en vídeo para TikTok For Business',                      'tiktok-ads',    NULL,                             '#010101', '#333333', 'rounded', 15),
('traffic', 'LinkedIn Ads',        'linkedin-ads',       'Campañas patrocinadas B2B orientadas a profesionales',            'linkedin-ads',  NULL,                             '#0A66C2', '#064587', 'rounded', 16),
('traffic', 'YouTube Ads',         'youtube-ads',        'Anuncios pre-roll, in-feed y display en YouTube',                 'youtube-ads',   NULL,                             '#FF0000', '#CC0000', 'rounded', 17),
('traffic', 'SEO Orgánico',        'seo-organic',        'Tráfico orgánico no pagado desde motores de búsqueda',            'seo',           NULL,                             '#34A853', '#1E7A30', 'rounded', 18),
('traffic', 'Email Marketing',     'email-marketing',    'Tráfico generado desde boletines y campañas de email',            'email',         NULL,                             '#EA4335', '#B31412', 'rounded', 19),
('traffic', 'Tráfico Directo',     'direct-traffic',     'Visitantes directos que introducen la URL en el navegador',       'direct',        NULL,                             '#9B59B6', '#6C3483', 'rounded', 20),
('traffic', 'Referido / Afiliado', 'referral',           'Tráfico proveniente de enlaces de afiliados o sitios aliados',    'referral',      NULL,                             '#F39C12', '#B7770D', 'rounded', 21),
('traffic', 'SMS Marketing',       'sms-marketing',      'Tráfico y clicks directos desde campañas de mensajería SMS',      'sms',           NULL,                             '#27AE60', '#1A7942', 'rounded', 22),
('traffic', 'Twitter / X Ads',     'twitter-ads',        'Campañas publicitarias y tuits promocionados en X (Twitter)',     'twitter',       NULL,                             '#1DA1F2', '#1474B0', 'rounded', 23)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  icon_svg = VALUES(icon_svg),
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);

-- ------------------------------------------------------------
-- 2. Categoría: Páginas (Pages)
-- ------------------------------------------------------------
INSERT INTO node_types (category, name, slug, description, icon_name, icon_svg, default_color, border_color, shape, sort_order)
VALUES
('page', 'Landing Page',     'web-landing',      'Página de captura o aterrizaje principal',               'web_landing',  'assets/icons/web_landing.svg',  '#10B981', '#047857', 'rounded', 25),
('page', 'VSL Page',         'web-vsl',          'Página de ventas con Video Sales Letter (VSL)',          'web_vsl',      'assets/icons/web_vsl.svg',      '#EF4444', '#B91C1C', 'rounded', 26),
('page', 'Upsell Page',      'web-upsell',       'Página de venta adicional posterior (One-Click Upsell)', 'web_upsell',   'assets/icons/web_upsell.svg',   '#F59E0B', '#D97706', 'rounded', 27),
('page', 'Thank You Page',   'web-thankyou',     'Página de agradecimiento y confirmación',                'web_thankyou', 'assets/icons/web_thankyou.svg', '#8B5CF6', '#6D28D9', 'rounded', 28),
('page', 'Download Page',    'web-download',     'Página de descarga de recursos o lead magnet',           'web_download', 'assets/icons/web_download.svg', '#06B6D4', '#0891B2', 'rounded', 29),
('page', 'Landing Page Clásica', 'landing-page', 'Página de aterrizaje clásica',                           'landing',      NULL,                            '#2ECC71', '#1A7942', 'rounded', 30),
('page', 'Sales Page',       'sales-page',       'Página de ventas con carta de venta y oferta completa',  'sales',        NULL,                            '#E74C3C', '#922B21', 'rounded', 31),
('page', 'Squeeze Page',     'squeeze-page',     'Página de captura minimalista para captar emails',       'squeeze',      NULL,                            '#3498DB', '#1F618D', 'rounded', 32),
('page', 'Thank You Clásica','thank-you-page',   'Página de confirmación y agradecimiento post-conversión','thankyou',     NULL,                            '#27AE60', '#186A3B', 'rounded', 33),
('page', 'Checkout Page',    'checkout-page',    'Página con pasarela de pago para procesar la orden',     'checkout',     NULL,                            '#8E44AD', '#6C3483', 'rounded', 34),
('page', 'Webinar Page',     'webinar-page',     'Página de registro o sala de transmisión en vivo',       'webinar',      NULL,                            '#2980B9', '#1A5276', 'rounded', 35),
('page', 'Blog Post',        'blog-post',        'Artículo editorial de blog con contenido de alto valor', 'blog',         NULL,                            '#16A085', '#0E6655', 'rounded', 36),
('page', 'Video Sales Clásica','vsl-page',       'Página de venta enfocada en Vídeo Sales Letter (VSL)',   'video',        NULL,                            '#C0392B', '#7B241C', 'rounded', 37),
('page', 'Upsell Clásica',   'upsell-page',      'Oferta adicional post-compra con un clic (OTO 1)',       'upsell',       NULL,                            '#D35400', '#A04000', 'rounded', 38),
('page', 'Downsell Page',    'downsell-page',    'Oferta alternativa de menor costo ante rechazo de upsell','downsell',    NULL,                            '#839192', '#566573', 'rounded', 39)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  icon_svg = VALUES(icon_svg),
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);

-- ------------------------------------------------------------
-- 3. Categoría: Acciones (Actions)
-- ------------------------------------------------------------
INSERT INTO node_types (category, name, slug, description, icon_name, icon_svg, default_color, border_color, shape, sort_order)
VALUES
('action', 'Purchase',         'action-purchase','Compra o transacción comercial exitosa',                 'action_purchase','assets/icons/action_purchase.svg','#10B981','#047857','rounded', 45),
('action', 'Meeting',          'action-meeting', 'Reunión o llamada agendada (Zoom, Calendly)',            'action_meeting', 'assets/icons/action_meeting.svg', '#3B82F6','#1D4ED8','rounded', 46),
('action', 'Submit Form',      'event-form',     'Envío de formulario o registro de lead',                 'event_form',     'assets/icons/event_form.svg',     '#8B5CF6','#6D28D9','rounded', 47),
('action', 'Email Automation', 'auto-email',     'Secuencia automatizada por correo electrónico',          'auto_email',     'assets/icons/auto_email.svg',     '#EC4899','#DB2777','rounded', 48),
('action', 'Add Tag',          'tag-add',        'Asignación de etiqueta o segmentación en CRM',           'tag_add',        'assets/icons/tag_add.svg',        '#F59E0B','#D97706','rounded', 49),
('action', 'Formulario',       'form',           'Formulario de captura de datos de contacto o calificación', 'form',       NULL,                             '#1ABC9C','#0E8A6F','rounded', 50),
('action', 'Compra',           'purchase',       'Evento de transacción comercial completada exitosamente',   'purchase',   NULL,                             '#27AE60','#1A7942','rounded', 51),
('action', 'Suscripción',      'subscription',   'Alta confirmada en lista o newsletter',                     'subscribe',  NULL,                             '#2980B9','#1A5276','rounded', 52),
('action', 'Descarga',         'download',       'Descarga de lead magnet (ebook, PDF, plantilla)',          'download',   NULL,                             '#8E44AD','#6C3483','rounded', 53),
('action', 'Llamada CTA',      'cta',            'Clic en botón de llamada a la acción principal',            'cta',        NULL,                             '#E74C3C','#922B21','rounded', 54),
('action', 'Order Bump',       'order-bump',     'Oferta complementaria añadida dentro del checkout',         'bump',       NULL,                             '#F39C12','#B7770D','rounded', 55),
('action', 'Abandono',         'abandonment',    'Usuario que abandona el flujo antes de completar la acción','abandon',    NULL,                             '#95A5A6','#717D7E','rounded', 56)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  icon_svg = VALUES(icon_svg),
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);

-- ------------------------------------------------------------
-- 4. Categoría: Email
-- ------------------------------------------------------------
INSERT INTO node_types (category, name, slug, description, icon_name, default_color, border_color, shape, sort_order)
VALUES
('email', 'Secuencia de Email', 'email-sequence',   'Cadencia automatizada y programada de correos',           'sequence',       '#2C3E50', '#1A252F', 'rounded', 70),
('email', 'Email Broadcast',    'email-broadcast',  'Envío masivo y único a un segmento o lista completa',      'broadcast',      '#E74C3C', '#922B21', 'rounded', 71),
('email', 'Autoresponder',      'autoresponder',    'Correo de bienvenida o entrega inmediata tras el registro','autoresponder',  '#3498DB', '#1F618D', 'rounded', 72),
('email', 'Email Transaccional','transactional-email','Recibo, confirmación de pedido o reseteo de claves',     'trans-email',    '#27AE60', '#186A3B', 'rounded', 73)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);

-- ------------------------------------------------------------
-- 5. Categoría: Decisión y Elementos Estructurales (Decision & Other)
-- ------------------------------------------------------------
INSERT INTO node_types (category, name, slug, description, icon_name, default_color, border_color, shape, sort_order)
VALUES
('decision', 'Condición / Decisión', 'decision',  'Bifurcación condicional basada en reglas lógicas (Sí / No)', 'decision',  '#F1C40F', '#9A7D0A', 'diamond',   80),
('other',    'Inicio del Embudo',    'start',     'Punto de entrada inicial del flujo',                         'start',     '#2ECC71', '#1A7942', 'circle',    90),
('other',    'Fin del Embudo',       'end',       'Punto terminal o meta alcanzada del embudo',                 'end',       '#E74C3C', '#922B21', 'circle',    91),
('other',    'Nota / Anotación',     'note',      'Nota adhesiva explicativa o comentario sobre el lienzo',     'note',      '#F9E79F', '#9A7D0A', 'rounded',   92),
('other',    'Agrupador',            'group',     'Contenedor visual para delimitar fases o etapas',            'group',     '#D5D8DC', '#AAB7B8', 'rectangle', 93)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  icon_name = VALUES(icon_name),
  default_color = VALUES(default_color),
  border_color = VALUES(border_color),
  shape = VALUES(shape),
  sort_order = VALUES(sort_order);
