const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateEtapa2() {
  console.log('--- Iniciando migración de Etapa 2 ---');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  });

  try {
    // 1. Ejecutar Schema Etapa 2
    console.log('1. Aplicando schema_etapa2.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema_etapa2.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('✓ Tablas e índices de Etapa 2 creados correctamente.');

    // 2. Ejecutar Semillas de Tipos de Nodos
    console.log('2. Insertando seeds_node_types.sql...');
    const nodeTypesSql = fs.readFileSync(path.join(__dirname, 'seeds_node_types.sql'), 'utf8');
    await connection.query(nodeTypesSql);
    console.log('✓ Semillas de node_types aplicadas.');

    // 3. Ejecutar Semillas de Templates
    console.log('3. Insertando seeds_templates.sql...');
    const templatesSql = fs.readFileSync(path.join(__dirname, 'seeds_templates.sql'), 'utf8');
    await connection.query(templatesSql);
    console.log('✓ Semillas de templates aplicadas.');

    // 4. Verificación y conteo en base de datos
    const [nodeTypesCount] = await connection.query('SELECT COUNT(*) as total FROM node_types');
    const [templatesCount] = await connection.query('SELECT COUNT(*) as total FROM templates');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'funnelmapper_db' 
      ORDER BY TABLE_NAME
    `);

    console.log('==============================================');
    console.log(`✓ Total tipos de nodos en BD: ${nodeTypesCount[0].total}`);
    console.log(`✓ Total templates en BD: ${templatesCount[0].total}`);
    console.log('✓ Tablas actuales en funnelmapper_db:');
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    console.log('==============================================');
  } finally {
    await connection.end();
  }
}

migrateEtapa2().catch(err => {
  console.error('Error durante la migración de Etapa 2:', err);
  process.exit(1);
});
