const express = require('express');
const License = require('../models/License');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// VALIDATE LICENSE
router.post('/validate', async (req, res) => {
  try {
    const {
      licenseKey = '',
      machineId = '',
      machineName = ''
    } = req.body || {};

    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'License key is required'
      });
    }

    const normalizedKey = licenseKey.trim().toUpperCase();

    const license = await License.findOne({ licenseKey: normalizedKey });

    if (!license) {
      await AuditLog.create({
        eventType: 'bot_activation_failed',
        email: '',
        status: 'failed',
        details: `License not found: ${normalizedKey}`
      });

      return res.status(404).json({
        success: false,
        valid: false,
        message: 'License not found'
      });
    }

    if (license.status !== 'active') {
      await AuditLog.create({
        eventType: 'bot_activation_failed',
        email: license.email,
        status: 'failed',
        details: `License inactive: ${license.licenseKey}`
      });

      return res.status(403).json({
        success: false,
        valid: false,
        message: 'License is not active'
      });
    }

    if (license.validUntil && new Date(license.validUntil) < new Date()) {
      license.status = 'expired';
      await license.save();

      await AuditLog.create({
        eventType: 'bot_activation_failed',
        email: license.email,
        status: 'failed',
        details: `License expired: ${license.licenseKey}`
      });

      return res.status(403).json({
        success: false,
        valid: false,
        message: 'License expired'
      });
    }

    // First machine bind
    if (!license.machineId && machineId) {
      license.machineId = machineId;
      license.machineName = machineName || '';
      license.activatedDevices = 1;
    }
    // If already linked to another machine
    else if (license.machineId && machineId && license.machineId !== machineId) {
      await AuditLog.create({
        eventType: 'bot_activation_failed',
        email: license.email,
        status: 'failed',
        details: `Machine mismatch for ${license.licenseKey}. Existing: ${license.machineId}, New: ${machineId}`
      });

      return res.status(403).json({
        success: false,
        valid: false,
        message: 'License already linked to another machine'
      });
    }

    license.lastValidatedAt = new Date();
    await license.save();

    await AuditLog.create({
      eventType: 'bot_activation_success',
      email: license.email,
      status: 'success',
      details: `License validated successfully: ${license.licenseKey}`
    });

    return res.json({
      success: true,
      valid: true,
      message: 'License valid',
      license: {
        licenseKey: license.licenseKey,
        email: license.email,
        status: license.status,
        plan: license.plan,
        productName: license.productName,
        validFrom: license.validFrom,
        validUntil: license.validUntil,
        machineId: license.machineId,
        machineName: license.machineName,
        activatedDevices: license.activatedDevices,
        maxDevices: license.maxDevices
      }
    });
  } catch (error) {
    console.error('License validate error:', error.message);

    return res.status(500).json({
      success: false,
      valid: false,
      message: error.message
    });
  }
});

// RESET MACHINE
router.post('/reset-machine', async (req, res) => {
  try {
    const { licenseKey = '' } = req.body || {};

    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        message: 'License key is required'
      });
    }

    const normalizedKey = licenseKey.trim().toUpperCase();
    const license = await License.findOne({ licenseKey: normalizedKey });

    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'License not found'
      });
    }

    license.machineId = '';
    license.machineName = '';
    license.activatedDevices = 0;
    license.lastValidatedAt = null;
    await license.save();

    await AuditLog.create({
      eventType: 'license_machine_reset',
      email: license.email,
      status: 'success',
      details: `Machine reset for ${license.licenseKey}`
    });

    return res.json({
      success: true,
      message: 'Machine reset successful'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
