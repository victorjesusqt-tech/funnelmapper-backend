const pool = require('../config/database');

/**
 * Modelo de datos para la gestión de métricas y analítica en MySQL/MariaDB.
 */
class MetricsModel {
  /**
   * Registra o actualiza métricas para un nodo en una fecha y periodo determinados (UPSERT).
   */
  static async upsert({
    nodeId,
    funnelId,
    metricDate,
    periodType = 'day',
    visitors = 0,
    uniqueVisitors = 0,
    clicks = 0,
    conversions = 0,
    revenue = 0.00,
    cost = 0.00,
    bounceRate = 0,
    avgTimeSec = 0,
    customKpis = null,
    source = 'manual',
    notes = null,
    createdBy = null
  }) {
    const customKpisStr = customKpis
      ? (typeof customKpis === 'string' ? customKpis : JSON.stringify(customKpis))
      : null;

    const [result] = await pool.query(
      `INSERT INTO metrics (
        node_id, funnel_id, metric_date, period_type, visitors, unique_visitors,
        clicks, conversions, revenue, cost, bounce_rate, avg_time_sec,
        custom_kpis, source, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        visitors = VALUES(visitors),
        unique_visitors = VALUES(unique_visitors),
        clicks = VALUES(clicks),
        conversions = VALUES(conversions),
        revenue = VALUES(revenue),
        cost = VALUES(cost),
        bounce_rate = VALUES(bounce_rate),
        avg_time_sec = VALUES(avg_time_sec),
        custom_kpis = VALUES(custom_kpis),
        source = VALUES(source),
        notes = VALUES(notes),
        updated_at = NOW()`,
      [
        nodeId,
        funnelId,
        metricDate,
        periodType,
        visitors,
        uniqueVisitors,
        clicks,
        conversions,
        revenue,
        cost,
        bounceRate,
        avgTimeSec,
        customKpisStr,
        source,
        notes,
        createdBy
      ]
    );

    // Obtener el registro insertado o actualizado
    const [rows] = await pool.query(
      `SELECT * FROM metrics WHERE node_id = ? AND metric_date = ? AND period_type = ? LIMIT 1`,
      [nodeId, metricDate, periodType]
    );

    return rows[0] || null;
  }

  /**
   * Obtiene una métrica por su ID primario.
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, n.label AS node_label, f.name AS funnel_name
       FROM metrics m
       JOIN nodes n ON m.node_id = n.id
       JOIN funnels f ON m.funnel_id = f.id
       WHERE m.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Obtiene el historial de métricas de un nodo con filtros de fecha y tipo de periodo.
   */
  static async findByNodeId(nodeId, { startDate = null, endDate = null, periodType = null } = {}) {
    const conditions = ['node_id = ?'];
    const params = [nodeId];

    if (startDate) {
      conditions.push('metric_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('metric_date <= ?');
      params.push(endDate);
    }
    if (periodType) {
      conditions.push('period_type = ?');
      params.push(periodType);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT * FROM metrics ${whereClause} ORDER BY metric_date DESC, id DESC`,
      params
    );

    return rows;
  }

  /**
   * Obtiene todas las métricas de un embudo agrupadas o filtradas.
   */
  static async findByFunnelId(funnelId, { startDate = null, endDate = null, periodType = null } = {}) {
    const conditions = ['m.funnel_id = ?'];
    const params = [funnelId];

    if (startDate) {
      conditions.push('m.metric_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('m.metric_date <= ?');
      params.push(endDate);
    }
    if (periodType) {
      conditions.push('m.period_type = ?');
      params.push(periodType);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT m.*, n.label AS node_label, n.color AS node_color, n.node_type_id
       FROM metrics m
       JOIN nodes n ON m.node_id = n.id
       ${whereClause}
       ORDER BY m.metric_date DESC, n.id ASC`,
      params
    );

    return rows;
  }

  /**
   * Actualiza campos específicos de un registro de métricas.
   */
  static async update(id, fieldsToUpdate) {
    const allowed = [
      'visitors', 'unique_visitors', 'clicks', 'conversions',
      'revenue', 'cost', 'bounce_rate', 'avg_time_sec', 'notes'
    ];

    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (fieldsToUpdate[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(fieldsToUpdate[key]);
      }
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await pool.query(`UPDATE metrics SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  /**
   * Elimina un registro de métricas.
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM metrics WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Agrega totales y promedios cuantitativos de todo el embudo.
   */
  static async getFunnelAggregates(funnelId, { startDate = null, endDate = null } = {}) {
    const conditions = ['funnel_id = ?'];
    const params = [funnelId];

    if (startDate) {
      conditions.push('metric_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('metric_date <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT 
        COUNT(DISTINCT node_id) AS active_nodes,
        COALESCE(SUM(visitors), 0) AS total_visitors,
        COALESCE(SUM(unique_visitors), 0) AS total_unique_visitors,
        COALESCE(SUM(clicks), 0) AS total_clicks,
        COALESCE(SUM(conversions), 0) AS total_conversions,
        COALESCE(SUM(revenue), 0.00) AS total_revenue,
        COALESCE(SUM(cost), 0.00) AS total_cost,
        COALESCE(AVG(bounce_rate), 0) AS avg_bounce_rate,
        COALESCE(AVG(avg_time_sec), 0) AS avg_time_sec
       FROM metrics
       ${whereClause}`,
      params
    );

    return rows[0];
  }

  /**
   * Obtiene las métricas agregadas por cada nodo individual dentro del embudo.
   */
  static async getNodeTotalsByFunnel(funnelId, { startDate = null, endDate = null } = {}) {
    const conditions = ['m.funnel_id = ?'];
    const params = [funnelId];

    if (startDate) {
      conditions.push('m.metric_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('m.metric_date <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT 
        n.id AS node_id,
        n.label AS node_label,
        n.sublabel AS node_sublabel,
        n.color AS node_color,
        COALESCE(SUM(m.visitors), 0) AS visitors,
        COALESCE(SUM(m.unique_visitors), 0) AS unique_visitors,
        COALESCE(SUM(m.clicks), 0) AS clicks,
        COALESCE(SUM(m.conversions), 0) AS conversions,
        COALESCE(SUM(m.revenue), 0.00) AS revenue,
        COALESCE(SUM(m.cost), 0.00) AS cost,
        COALESCE(AVG(m.bounce_rate), 0) AS bounce_rate,
        COALESCE(AVG(m.avg_time_sec), 0) AS avg_time_sec
       FROM nodes n
       LEFT JOIN metrics m ON n.id = m.node_id AND ${conditions.join(' AND ')}
       WHERE n.funnel_id = ?
       GROUP BY n.id
       ORDER BY n.pos_x ASC, n.id ASC`,
      [...params, funnelId]
    );

    return rows;
  }

  // ==========================================
  // Objetivos y Metas (metric_goals)
  // ==========================================

  static async setGoal({
    nodeId,
    funnelId,
    goalVisitors = null,
    goalConversions = null,
    goalRevenue = null,
    goalConvRate = null,
    goalRoas = null,
    period = 'monthly'
  }) {
    await pool.query(
      `INSERT INTO metric_goals (
        node_id, funnel_id, goal_visitors, goal_conversions,
        goal_revenue, goal_conv_rate, goal_roas, period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        goal_visitors = VALUES(goal_visitors),
        goal_conversions = VALUES(goal_conversions),
        goal_revenue = VALUES(goal_revenue),
        goal_conv_rate = VALUES(goal_conv_rate),
        goal_roas = VALUES(goal_roas),
        updated_at = NOW()`,
      [nodeId, funnelId, goalVisitors, goalConversions, goalRevenue, goalConvRate, goalRoas, period]
    );

    const [rows] = await pool.query(
      `SELECT * FROM metric_goals WHERE node_id = ? AND period = ? LIMIT 1`,
      [nodeId, period]
    );

    return rows[0] || null;
  }

  static async findGoalsByNodeId(nodeId) {
    const [rows] = await pool.query(
      `SELECT * FROM metric_goals WHERE node_id = ? ORDER BY period ASC`,
      [nodeId]
    );
    return rows;
  }

  static async findGoalsByFunnelId(funnelId) {
    const [rows] = await pool.query(
      `SELECT g.*, n.label AS node_label
       FROM metric_goals g
       JOIN nodes n ON g.node_id = n.id
       WHERE g.funnel_id = ?
       ORDER BY n.id ASC, g.period ASC`,
      [funnelId]
    );
    return rows;
  }
}

module.exports = MetricsModel;

