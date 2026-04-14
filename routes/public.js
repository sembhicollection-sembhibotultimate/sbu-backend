
const express = require('express');
const AdminSetting = require('../models/AdminSetting');

const router = express.Router();

const DEFAULT_SITE_SETTINGS = {
  business_name: 'Sembhi Bot Ultimate',
  business_tagline: 'Professional Trading Automation Platform',
  hero_badge: 'Members Only • Premium Monthly Access',
  hero_title: 'Sembhi Bot Ultimate — Smarter Trading Starts Here',
  hero_subtitle: 'A premium futures trading membership focused on education, automation tooling, member resources, and disciplined execution.',
  hero_price: '$149',
  hero_price_suffix: '/ month',
  cta_primary_text: 'Start Subscription',
  cta_primary_link: '/auth/signup.html',
  cta_secondary_text: 'Member Login',
  cta_secondary_link: '/auth/login.html',
  logo_url: '',
  logo_width: '220',
  logo_height: '54',
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
  offer_enabled: True,
  offer_title: 'NEW PRODUCTS EVALS UP TO 20% OFF',
  offer_subtitle: 'Use Code "SBU20"',
  offer_code: 'SBU20',
  offer_button_text: 'Coupon "SBU20"',
  offer_end_at: '',
  disclaimer_short: 'Futures trading involves substantial risk and is not suitable for every investor. Sembhi Bot Ultimate provides software tools and educational content only and does not provide personal financial advice.',
  about_title: 'Experience, Strategy, Discipline — Your Edge in the Futures Market.',
  about_body: 'Sembhi Bot Ultimate supports futures traders with structured automation tools, educational guidance, and disciplined execution models focused on markets such as NQ, ES, YM, and GC. We do not provide personal financial advice. All examples, walkthroughs, and tools are provided for educational and analytical purposes only.',
  about_point_1_title: 'Expert Futures Focus',
  about_point_1_body: 'Built around futures markets, disciplined setups, and structured workflow.',
  about_point_2_title: 'Education-First Support',
  about_point_2_body: 'Members get access to guided resources, training, and platform support.',
  about_point_3_title: 'Risk-Aware Approach',
  about_point_3_body: 'Trading involves risk. Members remain responsible for their own decisions.',
  about_point_4_title: 'Continuous Improvement',
  about_point_4_body: 'Strategies, tools, and support are refined over time for long-term consistency.',
  how_title: 'Learn the reasoning behind every entry and exit.',
  how_body: 'Members can review educational content, platform walkthroughs, and structured trading concepts designed to improve discipline and process.',
  training_title: 'Learn Futures Trading Step-by-Step',
  training_body: 'Access structured tutorials covering market fundamentals, risk management, platform setup, and live examples.',
  features_title: 'Built as a complete trading membership business',
  feature_1_title: 'Portal Access',
  feature_1_body: 'Members-only access to portal tools, resources, and controlled software delivery.',
  feature_2_title: 'Training & Tutorials',
  feature_2_body: 'Educational material focused on practical futures trading workflow and software setup.',
  feature_3_title: 'Protected Delivery',
  feature_3_body: 'Licensed member flow, admin controls, and future bot delivery protection.',
  feature_4_title: 'Priority Support',
  feature_4_body: 'Members can access support channels and structured assistance.',
  performance_engine_name: 'Sembhi Performance Engine',
  performance_engine_desc: 'Advanced member analytics and performance review tools coming next.',
  trade_copier_name: 'Sembhi Trade Copier Free',
  trade_copier_desc: 'A future members-only copier utility planned as part of the ecosystem.',
  plan_name: 'Premium Membership',
  plan_price: '149',
  plan_currency: '$',
  plan_period: '/ month',
  plan_feature_1: 'Members-only portal',
  plan_feature_2: 'Protected bot delivery',
  plan_feature_3: 'Ongoing training and updates',
  plan_feature_4: 'Priority support structure',
}

router.get('/site-settings', async (req, res) => {
  try {
    const settings = await AdminSetting.find().sort({ key: 1 });
    const map = { ...DEFAULT_SITE_SETTINGS };
    for (const row of settings) {
      map[row.key] = row.value;
    }
    return res.json({ success: true, settings: map });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
