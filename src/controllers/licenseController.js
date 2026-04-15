export const validateLicense = async (req, res) => {
  const { licenseKey } = req.body;

  // 🔥 OWNER KEY DIRECT CHECK
  if (licenseKey === process.env.OWNER_LICENSE_KEY) {
    return res.json({
      success: true,
      status: "active",
      plan: "owner",
      isOwner: true
    });
  }

  // normal DB check
  const license = await License.findOne({ licenseKey });

  if (!license || license.status !== "active") {
    return res.status(401).json({
      success: false,
      message: "Invalid license"
    });
  }

  res.json({
    success: true,
    status: license.status,
    plan: license.plan
  });
};
