const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { firstName='', lastName='', name='', email='', mobile='', address='', password='', signature='' } = req.body || {};
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password are required' });
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ success:false, message:'User already exists with this email' });
    const fullName = name || [firstName,lastName].filter(Boolean).join(' ').trim() || 'Member';
    const user = await User.create({ firstName,lastName,name:fullName,email:normalizedEmail,mobile,address,password,signature,isActive:true });
    await AuditLog.create({ eventType:'signup', email:normalizedEmail, status:'success', details:'User signup completed' });
    return res.status(201).json({ success:true, message:'Signup successful', token:'demo-token', user:{ id:user._id, name:user.name, email:user.email, mobile:user.mobile, address:user.address, isActive:user.isActive, plan:'$149/month' } });
  } catch (error) { res.status(500).json({ success:false, message:error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email='', password='' } = req.body || {};
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password are required' });
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    if (user.isActive === false) return res.status(403).json({ success:false, message:'Your account has been disabled. Please contact admin.' });
    if (user.password !== password) return res.status(401).json({ success:false, message:'Invalid password' });
    await AuditLog.create({ eventType:'login', email:normalizedEmail, status:'success', details:'User login completed' });
    return res.json({ success:true, message:'Login successful', token:'demo-token', user:{ id:user._id, name:user.name, email:user.email, mobile:user.mobile, address:user.address, isActive:user.isActive, plan:'$149/month', profilePhoto:user.profilePhoto || '' } });
  } catch (error) { res.status(500).json({ success:false, message:error.message }); }
});

module.exports = router;
