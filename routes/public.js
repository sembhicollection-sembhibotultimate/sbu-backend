const express = require('express');
const AdminSetting = require('../models/AdminSetting');

const router = express.Router();

const DEFAULT_SITE_SETTINGS = {
  business_name: 'Sembhi Bot Ultimate',
  business_tagline: 'Professional Trading Automation Platform',
  hero_badge: 'Members Only • Premium Monthly Access',
  hero_title: 'Sembhi Bot Ultimate — Smarter Futures Trading Starts Here',
  hero_subtitle: 'A premium futures membership built around education, automation support, member resources, and disciplined execution in fast-moving markets.',
  logo_url: '',
  logo_width: '240',
  logo_height: '60',
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
  training_title: 'Learn Futures Trading Step by Step',
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
  background_image_url: '',
  background_opacity: 0.06,
  platform_offers: [
    { name: 'Apex Trader Funding', badge: '80% OFF', desc: 'Discounted evaluation access for futures traders who want lower entry cost and strong funding variety.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'BEST DEAL' },
    { name: 'Take Profit Trader', badge: '40% OFF', desc: 'Fast-track funding option with member-focused savings and practical rule structure.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'POPULAR' },
    { name: 'Trade Day', badge: '40% OFF', desc: 'Structured evaluation environment built for traders chasing consistency and growth.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'LIMITED' },
    { name: 'Funding Ticks', badge: '50% OFF', desc: 'Member savings on evaluation-style access, platform variety, and promotional offers.', coupon: 'SBU20', cta: 'Get Discount', url: '#', tag: 'LIMITED' }
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

module.exports = router;
