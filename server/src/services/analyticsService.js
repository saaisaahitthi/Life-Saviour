const Emergency = require('../models/Emergency');
const Analytics = require('../models/Analytics');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

class AnalyticsService {
  /**
   * Generates a daily summary of emergency operations
   */
  async generateDailySummary(date = new Date()) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $facet: {
          basicMetrics: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
                resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
                avgResponseTime: { 
                  $avg: { 
                    $divide: [
                      { $subtract: ["$resolvedAt", "$createdAt"] },
                      1000 * 60 // to minutes
                    ]
                  }
                }
              }
            }
          ],
          severityDist: [
            { $group: { _id: "$severity", count: { $sum: 1 } } }
          ],
          zoneDist: [
            { $group: { _id: "$zone", count: { $sum: 1 } } }
          ],
          typeDist: [
            { $group: { _id: "$transportType", count: { $sum: 1 } } }
          ]
        }
      }
    ];

    const [results] = await Emergency.aggregate(pipeline);
    
    const summary = {
      type: 'daily_summary',
      date: startOfDay,
      metrics: {
        totalEmergencies: results.basicMetrics[0]?.total || 0,
        criticalCount: results.basicMetrics[0]?.critical || 0,
        resolvedCount: results.basicMetrics[0]?.resolved || 0,
        averageResponseTime: results.basicMetrics[0]?.avgResponseTime || 0,
        severityDistribution: results.severityDist.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        zoneDistribution: results.zoneDist.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        typeDistribution: results.typeDist.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
      }
    };

    return await Analytics.findOneAndUpdate(
      { type: 'daily_summary', date: startOfDay },
      summary,
      { upsert: true, new: true }
    );
  }

  /**
   * Gets real-time dashboard data
   */
  async getLiveStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Emergency.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const activeEmergencies = await Emergency.countDocuments({ status: { $in: ['pending', 'assigned', 'in_progress'] } });
    const totalToday = stats.reduce((acc, curr) => acc + curr.count, 0);
    
    // Efficiency metrics
    const hospitals = await Hospital.countDocuments({ status: 'active' });
    const availableBeds = await Hospital.aggregate([
      { $group: { _id: null, total: { $sum: "$capacity.emergencyBeds.available" } } }
    ]);

    return {
      activeEmergencies,
      totalToday,
      statusDistribution: stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      hospitalLoad: {
        activeHospitals: hospitals,
        availableEmergencyBeds: availableBeds[0]?.total || 0
      }
    };
  }

  /**
   * Generates hospital performance metrics
   */
  async getHospitalPerformance() {
    return await Emergency.aggregate([
      { $match: { status: 'resolved', assignedHospital: { $exists: true } } },
      {
        $group: {
          _id: "$assignedHospital",
          avgResolutionTime: { 
            $avg: { 
              $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60] 
            } 
          },
          totalHandled: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: '_id',
          as: 'hospitalInfo'
        }
      },
      { $unwind: "$hospitalInfo" },
      {
        $project: {
          name: "$hospitalInfo.name",
          avgResolutionTime: 1,
          totalHandled: 1
        }
      }
    ]);
  }
}

module.exports = new AnalyticsService();
