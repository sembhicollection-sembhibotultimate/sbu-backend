const express = require('express');
const User = require('../models/User');
const License = require('../models/License');

const router = express.Router();

router.get('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email });
    const licenses = await License.find({ email }).sort({ createdAt: -1 });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/license/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const licenses = await License.find({ email, status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
