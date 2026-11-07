// backend/database/insert_social_icons.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'funnelmapper_db'
  });

  console.log('Connected to MariaDB/MySQL successfully.');

  const nodes = [
    {
      category: 'traffic',
      name: 'Facebook',
      slug: 'facebook',
      description: 'Tráfico y comunidad orgánica desde Facebook',
      icon_name: 'soc_facebook',
      icon_svg: 'assets/icons/soc_facebook.svg',
      default_color: '#1877F2',
      border_color: '#0D5BA8',
      shape: 'rounded',
      sort_order: 5
    },
    {
      category: 'traffic',
      name: 'Instagram',
      slug: 'instagram',
      description: 'Tráfico orgánico desde perfil, reels y stories de Instagram',
      icon_name: 'soc_instagram',
      icon_svg: 'assets/icons/soc_instagram.svg',
      default_color: '#E1306C',
      border_color: '#9B1B47',
      shape: 'rounded',
      sort_order: 6
    },
    {
      category: 'traffic',
      name: 'YouTube',
      slug: 'youtube',
      description: 'Tráfico orgánico desde canal de vídeos de YouTube',
      icon_name: 'soc_youtube',
      icon_svg: 'assets/icons/soc_youtube.svg',
      default_color: '#FF0000',
      border_color: '#CC0000',
      shape: 'rounded',
      sort_order: 7
    },
    {
      category: 'traffic',
      name: 'WhatsApp',
      slug: 'whatsapp',
      description: 'Tráfico y mensajería directa por WhatsApp',
      icon_name: 'soc_whatsapp',
      icon_svg: 'assets/icons/soc_whatsapp.svg',
      default_color: '#25D366',
      border_color: '#128C7E',
      shape: 'rounded',
      sort_order: 8
    }
  ];

  for (const node of nodes) {
    const query = `
      INSERT INTO node_types 
        (category, name, slug, description, icon_name, icon_svg, default_color, border_color, shape, sort_order, is_active)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        name = VALUES(name),
        description = VALUES(description),
        icon_name = VALUES(icon_name),
        icon_svg = VALUES(icon_svg),
        default_color = VALUES(default_color),
        border_color = VALUES(border_color),
        shape = VALUES(shape),
        sort_order = VALUES(sort_order),
        is_active = 1
    `;
    await connection.execute(query, [
      node.category,
      node.name,
      node.slug,
      node.description,
      node.icon_name,
      node.icon_svg,
      node.default_color,
      node.border_color,
      node.shape,
      node.sort_order
    ]);
    console.log(`Inserted / updated node: ${node.name} (${node.slug})`);
  }

  const [rows] = await connection.execute(
    'SELECT id, category, name, slug, icon_name, icon_svg, default_color, border_color, sort_order FROM node_types WHERE slug IN ("facebook", "instagram", "youtube", "whatsapp") ORDER BY sort_order ASC'
  );
  console.log('\nVerification of inserted records:');
  console.table(rows);

  await connection.end();
}

main().catch((err) => {
  console.error('Error inserting icons:', err);
  process.exit(1);
});

