const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  });

  // Semillas Etapa 1
  const sql = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');
  await connection.query(sql);
  console.log('✓ Seeds de Etapa 1 ejecutados');

  // Semillas Etapa 2: Node Types
  if (fs.existsSync(path.join(__dirname, 'seeds_node_types.sql'))) {
    const nodeTypesSql = fs.readFileSync(path.join(__dirname, 'seeds_node_types.sql'), 'utf8');
    await connection.query(nodeTypesSql);
    console.log('✓ Seeds de node_types ejecutados');
  }

  // Semillas Etapa 2: Templates
  if (fs.existsSync(path.join(__dirname, 'seeds_templates.sql'))) {
    const templatesSql = fs.readFileSync(path.join(__dirname, 'seeds_templates.sql'), 'utf8');
    await connection.query(templatesSql);
    console.log('✓ Seeds de templates ejecutados');
  }

  console.log('✓ Todas las semillas aplicadas exitosamente en funnelmapper_db');
  await connection.end();
}

runSeed().catch(err => {
  console.error('Error ejecutando seeds:', err);
  process.exit(1);
});

