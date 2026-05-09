const { query } = require('../config/db');

const getReportSummary = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const deathsResult = await query(
      `SELECT COUNT(*) FROM death_cases WHERE created_at >= $1`,
      [firstDayOfMonth]
    );
    const deathsThisMonth = parseInt(deathsResult.rows[0].count);

    const reservationsResult = await query(
      `SELECT COUNT(*) FROM reservations WHERE status IN ('pending', 'approved')`
    );
    const activeReservations = parseInt(reservationsResult.rows[0].count);

    const occupiedResult = await query(
      `SELECT COUNT(*) FROM graves WHERE status = 'occupied'`
    );
    const occupiedPlots = parseInt(occupiedResult.rows[0].count);

    const availableResult = await query(
      `SELECT COUNT(*) FROM graves WHERE status = 'available'`
    );
    const availablePlots = parseInt(availableResult.rows[0].count);

    const servicesResult = await query(
      `SELECT COUNT(*) FROM funeral_services WHERE status = 'completed'`
    );
    const servicesCompleted = parseInt(servicesResult.rows[0].count);

    const monthlyResult = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COUNT(*) as count
      FROM death_cases
      WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const deathCasesPerMonth = monthlyResult.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count)
    }));

    res.json({
      deathsThisMonth,
      activeReservations,
      occupiedPlots,
      availablePlots,
      servicesCompleted,
      deathCasesPerMonth
    });
  } catch (error) {
    console.error('Get report summary error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

module.exports = { getReportSummary };
