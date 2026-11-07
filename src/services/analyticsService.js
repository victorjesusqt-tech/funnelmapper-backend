const MetricsModel = require('../models/metricsModel');
const FunnelModel = require('../models/funnelModel');
const NodeModel = require('../models/nodeModel');
const ConnectionModel = require('../models/connectionModel');
const logger = require('../utils/logger');

/**
 * Servicio de negocio para la gestión de métricas, análisis de conversión,
 * cálculo de KPIs (ROI, ROAS, CPC, CPA) y metas de embudos.
 */
class AnalyticsService {
  /**
   * Valida acceso de un usuario a un embudo (propietario o admin).
   * @private
   */
  static async _checkFunnelAccess(funnelId, userId, role) {
    const funnel = await FunnelModel.findById(funnelId);
    if (!funnel) {
      const error = new Error(`Embudo con ID ${funnelId} no encontrado`);
      error.statusCode = 404;
      error.code = 'FUNNEL_NOT_FOUND';
      throw error;
    }

    if (role !== 'admin' && funnel.project_owner_id !== userId) {
      const error = new Error('No tienes permiso para acceder a este embudo');
      error.statusCode = 403;
      error.code = 'FUNNEL_ACCESS_DENIED';
      throw error;
    }

    return funnel;
  }

  /**
   * Valida acceso a un nodo específico verificando la pertenencia al embudo.
   * @private
   */
  static async _checkNodeAccess(nodeId, userId, role) {
    const node = await NodeModel.findById(nodeId);
    if (!node) {
      const error = new Error(`Nodo con ID ${nodeId} no encontrado`);
      error.statusCode = 404;
      error.code = 'NODE_NOT_FOUND';
      throw error;
    }

    const funnel = await this._checkFunnelAccess(node.funnel_id, userId, role);
    return { node, funnel };
  }

  /**
   * Registra o actualiza métricas para un nodo (UPSERT).
   */
  static async recordMetrics({
    nodeId,
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
    userId,
    role
  }) {
    if (!nodeId || !metricDate) {
      const error = new Error('nodeId y metricDate son campos requeridos');
      error.statusCode = 422;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Validar acceso al nodo
    const { node } = await this._checkNodeAccess(nodeId, userId, role);

    // Validar tipo de periodo
    const validPeriods = ['day', 'week', 'month'];
    const period = validPeriods.includes(periodType) ? periodType : 'day';

    // Normalizar valores numéricos
    const normVisitors = Math.max(0, parseInt(visitors, 10) || 0);
    const normUnique = Math.max(0, parseInt(uniqueVisitors, 10) || 0);
    const normClicks = Math.max(0, parseInt(clicks, 10) || 0);
    const normConversions = Math.max(0, parseInt(conversions, 10) || 0);
    const normRevenue = Math.max(0, parseFloat(revenue) || 0.00);
    const normCost = Math.max(0, parseFloat(cost) || 0.00);
    const normBounce = Math.min(100, Math.max(0, parseFloat(bounceRate) || 0));
    const normAvgTime = Math.max(0, parseInt(avgTimeSec, 10) || 0);

    const savedMetric = await MetricsModel.upsert({
      nodeId,
      funnelId: node.funnel_id,
      metricDate,
      periodType: period,
      visitors: normVisitors,
      uniqueVisitors: normUnique,
      clicks: normClicks,
      conversions: normConversions,
      revenue: normRevenue,
      cost: normCost,
      bounceRate: normBounce,
      avgTimeSec: normAvgTime,
      customKpis,
      source,
      notes: notes ? String(notes).trim().substring(0, 300) : null,
      createdBy: userId
    });

    logger.info(`Métricas registradas para nodo ${nodeId} fecha ${metricDate} por usuario ${userId}`);
    return savedMetric;
  }

  /**
   * Actualiza un registro existente de métricas por ID.
   */
  static async updateMetrics(id, updateData, userId, role) {
    const metric = await MetricsModel.findById(id);
    if (!metric) {
      const error = new Error(`Registro de métrica con ID ${id} no encontrado`);
      error.statusCode = 404;
      error.code = 'METRIC_NOT_FOUND';
      throw error;
    }

    await this._checkFunnelAccess(metric.funnel_id, userId, role);

    const updated = await MetricsModel.update(id, updateData);
    return updated;
  }

  /**
   * Elimina un registro de métricas por ID.
   */
  static async deleteMetrics(id, userId, role) {
    const metric = await MetricsModel.findById(id);
    if (!metric) {
      const error = new Error(`Registro de métrica con ID ${id} no encontrado`);
      error.statusCode = 404;
      error.code = 'METRIC_NOT_FOUND';
      throw error;
    }

    await this._checkFunnelAccess(metric.funnel_id, userId, role);

    return await MetricsModel.delete(id);
  }

  /**
   * Obtiene el historial de métricas de un nodo con filtros opcionales.
   */
  static async getNodeMetrics(nodeId, filters, userId, role) {
    await this._checkNodeAccess(nodeId, userId, role);
    return await MetricsModel.findByNodeId(nodeId, filters);
  }

  /**
   * Obtiene todas las métricas de un embudo.
   */
  static async getFunnelMetrics(funnelId, filters, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);
    return await MetricsModel.findByFunnelId(funnelId, filters);
  }

  /**
   * Calcula el resumen cuantitativo del embudo con KPIs agregados:
   * ROI, ROAS, CPC, CPA, EPC, Tasa de Conversión global y desglose por nodo.
   */
  static async getFunnelSummary(funnelId, filters, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);

    const aggregates = await MetricsModel.getFunnelAggregates(funnelId, filters);
    const nodeTotals = await MetricsModel.getNodeTotalsByFunnel(funnelId, filters);

    const totalVisitors = Number(aggregates?.total_visitors || 0);
    const totalUniqueVisitors = Number(aggregates?.total_unique_visitors || 0);
    const totalClicks = Number(aggregates?.total_clicks || 0);
    const totalConversions = Number(aggregates?.total_conversions || 0);
    const totalRevenue = Number(aggregates?.total_revenue || 0);
    const totalCost = Number(aggregates?.total_cost || 0);

    // KPIs calculados
    const overallConversionRate = totalVisitors > 0
      ? Number(((totalConversions / totalVisitors) * 100).toFixed(2))
      : 0;

    const roi = totalCost > 0
      ? Number((((totalRevenue - totalCost) / totalCost) * 100).toFixed(2))
      : 0;

    const roas = totalCost > 0
      ? Number((totalRevenue / totalCost).toFixed(2))
      : 0;

    const cpc = totalClicks > 0
      ? Number((totalCost / totalClicks).toFixed(2))
      : 0;

    const cpa = totalConversions > 0
      ? Number((totalCost / totalConversions).toFixed(2))
      : 0;

    const epc = totalClicks > 0
      ? Number((totalRevenue / totalClicks).toFixed(2))
      : 0;

    const avgOrderValue = totalConversions > 0
      ? Number((totalRevenue / totalConversions).toFixed(2))
      : 0;

    const avgBounceRate = Number(Number(aggregates?.avg_bounce_rate || 0).toFixed(2));
    const avgTimeSec = Math.round(Number(aggregates?.avg_time_sec || 0));
    const activeNodes = Number(aggregates?.active_nodes || 0);

    // Desglose por nodo
    const nodeSummaries = nodeTotals.map(node => {
      const visitors = Number(node.visitors || 0);
      const uniqueVisitors = Number(node.unique_visitors || 0);
      const clicks = Number(node.clicks || 0);
      const conversions = Number(node.conversions || 0);
      const revenue = Number(node.revenue || 0);
      const cost = Number(node.cost || 0);

      const conversionRate = visitors > 0
        ? Number(((conversions / visitors) * 100).toFixed(2))
        : 0;

      const nodeRoi = cost > 0
        ? Number((((revenue - cost) / cost) * 100).toFixed(2))
        : 0;

      const nodeRoas = cost > 0
        ? Number((revenue / cost).toFixed(2))
        : 0;

      return {
        nodeId: node.node_id,
        label: node.node_label,
        sublabel: node.node_sublabel,
        color: node.node_color,
        visitors,
        uniqueVisitors,
        clicks,
        conversions,
        revenue,
        cost,
        conversionRate,
        roi: nodeRoi,
        roas: nodeRoas,
        bounceRate: Number(Number(node.bounce_rate || 0).toFixed(2)),
        avgTimeSec: Math.round(Number(node.avg_time_sec || 0))
      };
    });

    return {
      funnelId,
      summary: {
        totalVisitors,
        totalUniqueVisitors,
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCost,
        overallConversionRate,
        roi,
        roas,
        cpc,
        cpa,
        epc,
        avgOrderValue,
        avgBounceRate,
        avgTimeSec,
        activeNodes
      },
      nodes: nodeSummaries,
      filters: {
        startDate: filters?.startDate || null,
        endDate: filters?.endDate || null,
        periodType: filters?.periodType || null
      }
    };
  }

  /**
   * Calcula el flujo de conversión entre nodos conectados en el embudo (nodo a nodo).
   * Determina la tasa de paso, caída de visitantes (drop-off) y el estado de salud:
   * Verde (>= 20%), Amarillo (10-20%), Rojo (< 10%).
   */
  static async getConversionFlow(funnelId, filters, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);

    const [connections, nodeTotals] = await Promise.all([
      ConnectionModel.findByFunnelId(funnelId),
      MetricsModel.getNodeTotalsByFunnel(funnelId, filters)
    ]);

    const nodeMap = new Map();
    nodeTotals.forEach(node => {
      nodeMap.set(node.node_id, {
        nodeId: node.node_id,
        label: node.node_label,
        visitors: Number(node.visitors || 0),
        conversions: Number(node.conversions || 0),
        revenue: Number(node.revenue || 0),
        cost: Number(node.cost || 0)
      });
    });

    const flow = connections.map(conn => {
      const source = nodeMap.get(conn.source_node_id) || {
        nodeId: conn.source_node_id,
        label: `Nodo #${conn.source_node_id}`,
        visitors: 0
      };
      const target = nodeMap.get(conn.target_node_id) || {
        nodeId: conn.target_node_id,
        label: `Nodo #${conn.target_node_id}`,
        visitors: 0
      };

      const sourceVisitors = source.visitors;
      const targetVisitors = target.visitors;

      const conversionRate = sourceVisitors > 0
        ? Number(((targetVisitors / sourceVisitors) * 100).toFixed(2))
        : 0;

      const dropOffVisitors = Math.max(0, sourceVisitors - targetVisitors);
      const dropOffRate = sourceVisitors > 0
        ? Number(((dropOffVisitors / sourceVisitors) * 100).toFixed(2))
        : 0;

      let healthStatus = 'good'; // Verde >= 20%
      if (conversionRate < 10) {
        healthStatus = 'critical'; // Rojo < 10%
      } else if (conversionRate < 20) {
        healthStatus = 'warning'; // Amarillo 10-20%
      }

      return {
        connectionId: conn.id,
        connectionLabel: conn.label || null,
        sourceNodeId: conn.source_node_id,
        sourceNodeLabel: source.label,
        targetNodeId: conn.target_node_id,
        targetNodeLabel: target.label,
        sourceVisitors,
        targetVisitors,
        conversionRate,
        dropOffVisitors,
        dropOffRate,
        healthStatus
      };
    });

    // Detectar cuello de botella (etapa con menor tasa de conversión que tenga tráfico en origen)
    let bottleneck = null;
    const activeSteps = flow.filter(f => f.sourceVisitors > 0);
    if (activeSteps.length > 0) {
      bottleneck = activeSteps.reduce((lowest, current) => {
        return current.conversionRate < lowest.conversionRate ? current : lowest;
      }, activeSteps[0]);
    }

    return {
      funnelId,
      totalConnections: connections.length,
      flow,
      bottleneck
    };
  }

  /**
   * Guarda o actualiza los objetivos (goals) de un nodo.
   */
  static async setNodeGoal(nodeId, goalData, userId, role) {
    const { node } = await this._checkNodeAccess(nodeId, userId, role);

    const validPeriods = ['daily', 'weekly', 'monthly'];
    const period = validPeriods.includes(goalData.period) ? goalData.period : 'monthly';

    const goal = await MetricsModel.setGoal({
      nodeId,
      funnelId: node.funnel_id,
      goalVisitors: goalData.goalVisitors !== undefined ? parseInt(goalData.goalVisitors, 10) : null,
      goalConversions: goalData.goalConversions !== undefined ? parseInt(goalData.goalConversions, 10) : null,
      goalRevenue: goalData.goalRevenue !== undefined ? parseFloat(goalData.goalRevenue) : null,
      goalConvRate: goalData.goalConvRate !== undefined ? parseFloat(goalData.goalConvRate) : null,
      goalRoas: goalData.goalRoas !== undefined ? parseFloat(goalData.goalRoas) : null,
      period
    });

    return goal;
  }

  /**
   * Obtiene los objetivos configurados para un nodo.
   */
  static async getNodeGoals(nodeId, userId, role) {
    await this._checkNodeAccess(nodeId, userId, role);
    return await MetricsModel.findGoalsByNodeId(nodeId);
  }

  /**
   * Obtiene todos los objetivos de los nodos de un embudo.
   */
  static async getFunnelGoals(funnelId, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);
    return await MetricsModel.findGoalsByFunnelId(funnelId);
  }
}

module.exports = AnalyticsService;

