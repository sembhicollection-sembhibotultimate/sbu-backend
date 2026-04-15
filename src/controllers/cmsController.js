import SiteSettings from "../models/SiteSettings.js";
import HomeSections from "../models/HomeSections.js";
import LiveOfferBar from "../models/LiveOfferBar.js";

export const getCmsBundle = async (req, res) => {
  let siteSettings = await SiteSettings.findOne();
  let homeSections = await HomeSections.findOne();
  let liveOfferBar = await LiveOfferBar.findOne();

  if (!siteSettings) siteSettings = await SiteSettings.create({});
  if (!homeSections) homeSections = await HomeSections.create({});
  if (!liveOfferBar) liveOfferBar = await LiveOfferBar.create({});

  res.json({
    success: true,
    data: { siteSettings, homeSections, liveOfferBar }
  });
};

export const updateSiteSettings = async (req, res) => {
  const existing = await SiteSettings.findOne();
  const updated = existing
    ? await SiteSettings.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: true })
    : await SiteSettings.create(req.body);

  res.json({ success: true, data: updated });
};

export const updateHomeSections = async (req, res) => {
  const existing = await HomeSections.findOne();
  const updated = existing
    ? await HomeSections.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: true })
    : await HomeSections.create(req.body);

  res.json({ success: true, data: updated });
};

export const updateLiveOfferBar = async (req, res) => {
  const existing = await LiveOfferBar.findOne();
  const updated = existing
    ? await LiveOfferBar.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: true })
    : await LiveOfferBar.create(req.body);

  res.json({ success: true, data: updated });
};
