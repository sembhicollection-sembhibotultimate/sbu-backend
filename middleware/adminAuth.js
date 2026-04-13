module.exports = function adminAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'No admin key provided'
      });
    }

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin auth error'
    });
  }
};
