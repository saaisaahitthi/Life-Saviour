const analyticsService = require('../services/analyticsService');

exports.getOverview = async (req, res) => {
  try {
    const liveStats = await analyticsService.getLiveStats();
    const dailySummary = await analyticsService.generateDailySummary();
    
    // Format for frontend
    res.json({
      overview: {
        totalToday: liveStats.totalToday,
        avgResponseTime: dailySummary.metrics.averageResponseTime.toFixed(1),
        activeCount: liveStats.activeEmergencies,
        resolvedCount: dailySummary.metrics.resolvedCount
      },
      hourlyTrends: [
        { hour: '00:00', count: 2 }, { hour: '04:00', count: 5 }, { hour: '08:00', count: 12 },
        { hour: '12:00', count: 18 }, { hour: '16:00', count: 14 }, { hour: '20:00', count: 8 }
      ],
      severityDistribution: Object.entries(dailySummary.metrics.severityDistribution || {}).map(([name, value]) => ({ name, value })),
      categoryDistribution: [
        { name: 'Cardiac', value: 15 },
        { name: 'Trauma', value: 25 },
        { name: 'Respiratory', value: 10 },
        { name: 'Neurological', value: 8 }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const Hospital = require('../models/Hospital');
    const hospitals = await Hospital.find();
    const formatted = hospitals.map(h => {
      const total = h.capacity.emergencyBeds.total || 1;
      const available = h.capacity.emergencyBeds.available || 0;
      const activeCases = total - available;
      const loadPercentage = Math.floor((activeCases / total) * 100);

      return {
        name: h.name,
        loadPercentage: loadPercentage,
        activeCases: activeCases < 0 ? 0 : activeCases,
        capacity: total
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const performance = await analyticsService.getHospitalPerformance();
    const fields = ['name', 'avgResolutionTime', 'totalHandled'];
    const { Parser } = require('json2csv');
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(performance);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('hospital_performance.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
