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
  const saved = current
    ? await SiteSettings.findByIdAndUpdate(current._id, req.body, { new: true, runValidators: true })
    : await SiteSettings.create(req.body);

  res.json({ success: true, data: saved });
}

export async function updateHomeSections(req, res) {
  const current = await HomeSections.findOne();
  const saved = current
    ? await HomeSections.findByIdAndUpdate(current._id, req.body, { new: true, runValidators: true })
    : await HomeSections.create(req.body);

  res.json({ success: true, data: saved });
}

export async function updateLiveOfferBar(req, res) {
  const current = await LiveOfferBar.findOne();
  const saved = current
    ? await LiveOfferBar.findByIdAndUpdate(current._id, req.body, { new: true, runValidators: true })
    : await LiveOfferBar.create(req.body);

  res.json({ success: true, data: saved });
}
