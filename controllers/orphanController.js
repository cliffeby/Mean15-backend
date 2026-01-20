const orphanHandler = require('../utils/orphanHandler');

/**
 * Get orphaned records report
 */
exports.getOrphanReport = async (req, res, next) => {
  try {
    const report = await orphanHandler.generateOrphanReport();
    console.log('Orphan Report generated:', report);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up orphaned records
 */
exports.cleanupOrphans = async (req, res, next) => {
  try {
    const { strategy = 'nullify' } = req.body;
    
    // Validate strategy
    const validStrategies = ['delete', 'nullify', 'preserve'];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid strategy. Use: delete, nullify, or preserve'
      });
    }

    const results = await orphanHandler.cleanupOrphans(strategy);
    
    res.json({
      success: true,
      message: `Orphaned records cleaned up using ${strategy} strategy`,
      results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find specific orphaned scores
 */
exports.findOrphans = async (req, res, next) => {
  try {
    const orphans = await orphanHandler.findOrphanedScores();
    console.log('Orphan Report generated:', orphans);
    res.json({
      success: true,
      orphans
    });
  } catch (error) {
    next(error);
  }
};