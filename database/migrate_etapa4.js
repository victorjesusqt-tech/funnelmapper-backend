const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateEtapa4() {
  console.log('--- Iniciando migración de Etapa 4 (Métricas y Analítica) ---');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  });

  try {
    console.log('1. Aplicando schema_etapa4.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema_etapa4.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('✓ Tablas metrics, metric_goals, exports y public_shares creadas correctamente.');

    // Verificación
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'funnelmapper_db' 
      ORDER BY TABLE_NAME
    `);

    console.log('==============================================');
    console.log('✓ Tablas actuales en funnelmapper_db:');
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    console.log('==============================================');
  } finally {
    await connection.end();
  }
}

migrateEtapa4().catch(err => {
  console.error('Error durante la migración de Etapa 4:', err);
  process.exit(1);
});

