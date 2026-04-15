const express = require('express');
const AdminSetting = require('../models/AdminSetting');
const Coupon = require('../models/Coupon');

const router = express.Router();

const DEFAULT_SITE_SETTINGS = {
  business_name: 'Sembhi Bot Ultimate',
  business_tagline: 'Professional Trading Automation Platform',
  hero_badge: 'Members Only • Premium Monthly Access',
  hero_title: 'Sembhi Bot Ultimate — Smarter Trading Starts Here',
  hero_subtitle: 'A premium bot, portal, and subscription experience built for futures traders who value structure, support, and disciplined execution.',
  cta_primary_text: 'Start Subscription',
  cta_primary_link: '/auth/signup.html',
  cta_secondary_text: 'Member Login',
  cta_secondary_link: '/auth/login.html',
  logo_url: '',
  logo_width: '280',
  logo_height: '74',
  background_image_url: '',
  background_opacity: '0.06',
  support_email: 'support@sembhibotultimate.com',
  support_phone: '0432 563 568',
  support_whatsapp: '',
  support_facebook: '',
  support_instagram: '',
  support_tiktok: '',
  support_youtube: '',
  support_linkedin: '',
  business_location: 'Melbourne, Australia',
  footer_about: 'Premium members-only trading website for bot access, private portal content, member education, and controlled software licensing.',
  admin_name: 'Site Owner',
  admin_email: 'support@sembhibotultimate.com',
  admin_mobile: '',
  offer_enabled: true,
  offer_title: 'Premium Access Discount Live',
  offer_subtitle: 'Use code SBU20 at checkout',
  offer_code: 'SBU20',
  offer_button_text: 'Coupon SBU20',
  offer_end_at: '',
  disclaimer_short: 'Futures trading involves substantial risk and is not suitable for every investor. Sembhi Bot Ultimate provides software tools and educational content only and does not provide personal financial advice.',
  about_title: 'Experience, Strategy, Discipline — Built for Futures Traders Who Want Structure.',
  about_body: 'Sembhi Bot Ultimate supports traders active in futures markets such as NQ, ES, YM, and GC through educational content, automation tooling support, and structured member resources. Nothing on this website is personal financial advice. Members remain responsible for their own trading decisions.',
  about_point_1_title: 'Futures-Focused Learning',
  about_point_1_body: 'Built around practical futures workflows, live market structure, and repeatable process.',
  about_point_2_title: 'Member Education',
  about_point_2_body: 'Members receive guided training, software orientation, and structured updates.',
  about_point_3_title: 'Risk-Aware Approach',
  about_point_3_body: 'Trading involves substantial risk. Members should only trade capital they can afford to risk.',
  about_point_4_title: 'Continuous Improvement',
  about_point_4_body: 'Tools, training, and member support are refined to improve clarity and consistency over time.',
  training_title: 'Learn Futures Trading Step-by-Step',
  training_body: 'Members get structured tutorials covering market fundamentals, execution models, risk controls, and real workflow examples.',
  performance_engine_name: 'Sembhi Performance Engine',
  trade_copier_name: 'Sembhi Trade Copier Free',
  plan_name: 'Premium Membership',
  plan_price: '149',
  plan_currency: '$',
  plan_period: '/ month',
  plan_feature_1: 'Members-only portal',
  plan_feature_2: 'Protected bot delivery',
  plan_feature_3: 'Ongoing training and updates',
  plan_feature_4: 'Priority support structure',
  checkout_default_coupon: 'SBU20',
  signup_caption: 'No coupon? Leave it blank and continue normally.',
  platform_offers: [
    { name: 'Apex Trader Funding', badge: '80% OFF', desc: 'Discounted evaluation access for futures traders who want lower entry cost and strong funding variety.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'BEST DEAL', showCoupon: true, image: '' },
    { name: 'Take Profit Trader', badge: '40% OFF', desc: 'Fast-track funding option with member-focused savings and practical rule structure.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'POPULAR', showCoupon: true, image: '' },
    { name: 'Trade Day', badge: '40% OFF', desc: 'Structured evaluation environment built for traders chasing consistency and growth.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'LIMITED', showCoupon: true, image: '' },
    { name: 'Funding Ticks', badge: '50% OFF', desc: 'Member savings on evaluation-style access, platform variety, and promotional offers.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'LIMITED', showCoupon: true, image: '' }
  ]
};

router.get('/site-settings', async (req, res) => {
  try {
    const settings = await AdminSetting.find().sort({ key: 1 });
    const map = { ...DEFAULT_SITE_SETTINGS };
    for (const row of settings) map[row.key] = row.value;
    return res.json({ success: true, settings: map });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/validate-coupon', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const amount = Number(req.query.amount || 0);
    if (!code) return res.json({ success: true, valid: false, message: 'Coupon code is required', finalAmount: amount });

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) return res.json({ success: true, valid: false, message: 'Coupon is invalid or inactive', finalAmount: amount });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.json({ success: true, valid: false, message: 'Coupon has expired', finalAmount: amount });
    if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) return res.json({ success: true, valid: false, message: 'Coupon redemption limit reached', finalAmount: amount });

    let finalAmount = amount;
    let discountLabel = '';
    if (coupon.discountType === 'percent') {
      finalAmount = Math.max(0, amount - (amount * Number(coupon.discountValue) / 100));
      discountLabel = `${coupon.discountValue}% OFF`;
    } else {
      finalAmount = Math.max(0, amount - Number(coupon.discountValue));
      discountLabel = `$${Number(coupon.discountValue).toFixed(2)} OFF`;
    }

    return res.json({ success: true, valid: true, finalAmount: Number(finalAmount.toFixed(2)), discountLabel, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
