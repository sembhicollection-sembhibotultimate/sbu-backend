import SiteSettings from "../models/SiteSettings.js";
import HomeSections from "../models/HomeSections.js";
import LiveOfferBar from "../models/LiveOfferBar.js";

export async function getCmsBundle(req, res) {
  const [siteSettings, homeSections, liveOfferBar] = await Promise.all([
    SiteSettings.findOne(),
    HomeSections.findOne(),
    LiveOfferBar.findOne()
  ]);

  res.json({
    success: true,
    data: { siteSettings, homeSections, liveOfferBar }
  });
}

export async function updateSiteSettings(req, res) {
  const current = await SiteSettings.findOne();
  const payload = {
    siteName: req.body.siteName,
    logoUrl: req.body.logoUrl,
    supportEmail: req.body.supportEmail,
    supportPhone: req.body.supportPhone,
    backgroundImageUrl: req.body.backgroundImageUrl,
    backgroundOpacity: req.body.backgroundOpacity,
    heroHeadline: req.body.heroHeadline,
    heroSubtext: req.body.heroSubtext,
    offerTitle: req.body.offerTitle,
    offerCode: req.body.offerCode,
    offerBadge: req.body.offerBadge,
    sessionsEnabled: req.body.sessionsEnabled,
    sessionsTitle: req.body.sessionsTitle,
    sessionsSubtext: req.body.sessionsSubtext,
    socialLinks: req.body.socialLinks,
    theme: req.body.theme
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const saved = current
    ? await SiteSettings.findByIdAndUpdate(current._id, payload, { new: true, runValidators: true })
    : await SiteSettings.create(payload);

  res.json({ success: true, data: saved, message: "Site settings saved" });
}

export async function updateHomeSections(req, res) {
  const current = await HomeSections.findOne();
  const payload = req.body || {};
  const saved = current
    ? await HomeSections.findByIdAndUpdate(current._id, payload, { new: true, runValidators: true })
    : await HomeSections.create(payload);

  res.json({ success: true, data: saved, message: "Home sections saved" });
}

export async function updateLiveOfferBar(req, res) {
  const current = await LiveOfferBar.findOne();
  const payload = req.body || {};
  const saved = current
    ? await LiveOfferBar.findByIdAndUpdate(current._id, payload, { new: true, runValidators: true })
    : await LiveOfferBar.create(payload);

  res.json({ success: true, data: saved, message: "Live offer bar saved" });
}
