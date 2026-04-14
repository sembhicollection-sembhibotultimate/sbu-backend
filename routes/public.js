const express = require('express');
const AdminSetting = require('../models/AdminSetting');
const Coupon = require('../models/Coupon');

const router = express.Router();

const DEFAULT_SETTINGS = {
  business_name: 'Sembhi Bot Ultimate',
  business_subtitle: 'Professional Trading Automation Platform',
  support_email: 'support@sembhibotultimate.com',
  support_phone: '0432 563 568',
  business_location: 'Melbourne, Australia',
  logo_url: '',
  logo_width: 56,
  logo_height: 56,
  background_image_url: '',
  background_opacity: 0.05,
  monthly_price: 149,
  top_offer_enabled: true,
  top_offer_text: 'Premium Access Discount Live',
  top_offer_subtext: 'Use code SBU20 at checkout',
  top_offer_coupon: 'Coupon SBU20',
  top_offer_expires_at: '',
  plan_code: 'CODE: SBU20',
  social_links: [
    { label: 'Email', url: 'mailto:support@sembhibotultimate.com' }
  ],
  platform_offers: []
};

async function settingsMap() {
  const rows = await AdminSetting.find();
  const map = { ...DEFAULT_SETTINGS };
  rows.forEach(row => { map[row.key] = row.value; });
  return map;
}

router.get('/site-settings', async (req, res) => {
  try {
    const settings = await settingsMap();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/offers', async (req, res) => {
  try {
    const settings = await settingsMap();
    res.json({ success: true, offers: Array.isArray(settings.platform_offers) ? settings.platform_offers : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/coupon/:code', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return res.status(400).json({ success: false, message: 'Coupon not active yet' });
    if (coupon.expiresAt && now > coupon.expiresAt) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.maxRedemptions > 0 && coupon.redeemedCount >= coupon.maxRedemptions) return res.status(400).json({ success: false, message: 'Coupon redemption limit reached' });

    const settings = await settingsMap();
    const basePrice = Number(settings.monthly_price || 149);
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = +(basePrice * (Number(coupon.discountValue || 0) / 100)).toFixed(2);
    } else {
      discountAmount = Math.min(basePrice, Number(coupon.discountValue || 0));
    }
    const finalAmount = Math.max(0, +(basePrice - discountAmount).toFixed(2));
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
