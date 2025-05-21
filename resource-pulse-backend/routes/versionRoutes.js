const express = require('express');
const versionService = require('../services/versionService');
const router = express.Router();

// GET /api/version - Get version information
router.get('/', (req, res) => {
  try {
    const versionInfo = versionService.getFullVersionInfo();
    res.json({
      success: true,
      data: versionInfo
    });
  } catch (error) {
    console.error('Error getting version info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving version information',
      error: error.message
    });
  }
});

// GET /api/version/string - Get version as a simple string
router.get('/string', (req, res) => {
  try {
    const versionString = versionService.getVersionString();
    res.json({
      success: true,
      version: versionString
    });
  } catch (error) {
    console.error('Error getting version string:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving version string',
      error: error.message
    });
  }
});

module.exports = router;