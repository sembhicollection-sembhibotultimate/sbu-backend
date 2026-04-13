const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const {
      firstName = '',
      lastName = '',
      name = '',
      email = '',
      mobile = '',
      address = '',
      password = ''
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const fullName =
      name ||
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      'Member';

    const user = await User.create({
      firstName,
      lastName,
      name: fullName,
      email: normalizedEmail,
      mobile,
      address,
      password,
      isActive: true
    });

    await AuditLog.create({
      eventType: 'signup',
      email: normalizedEmail,
      status: 'success',
      details: 'User signup completed'
    });

    return res.status(201).json({
      success: true,
      message: 'Signup successful',
      token: 'demo-token',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        isActive: user.isActive,
        plan: '$149/month'
      }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await AuditLog.create({
        eventType: 'login_failed',
        email: normalizedEmail,
        status: 'failed',
        details: 'User not found'
      });

      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔴 DISABLE USER LOGIN CHECK
    if (user.isActive === false) {
      await AuditLog.create({
        eventType: 'login_blocked',
        email: normalizedEmail,
        status: 'blocked',
        details: 'Disabled user tried to login'
      });

      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact admin.'
      });
    }

    if (user.password !== password) {
      await AuditLog.create({
        eventType: 'login_failed',
        email: normalizedEmail,
        status: 'failed',
        details: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    await AuditLog.create({
      eventType: 'login',
      email: normalizedEmail,
      status: 'success',
      details: 'User login completed'
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token: 'demo-token',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        isActive: user.isActive,
        plan: '$149/month'
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
