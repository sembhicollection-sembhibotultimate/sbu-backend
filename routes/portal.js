const express = require('express');
const User = require('../models/User');
const License = require('../models/License');
const router = express.Router();

router.get('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email });
    const licenses = await License.find({ email }).sort({ createdAt: -1 });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user, licenses });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.patch('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    const { name, mobile, address, profilePhoto } = req.body || {};
    if (typeof name === 'string') user.name = name.trim();
    if (typeof mobile === 'string') user.mobile = mobile.trim();
    if (typeof address === 'string') user.address = address.trim();
    if (typeof profilePhoto === 'string') user.profilePhoto = profilePhoto;
    await user.save();
    res.json({ success:true, user });
  } catch (error) { res.status(500).json({ success:false, message:error.message }); }
});

module.exports = router;
