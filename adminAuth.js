module.exports = function adminAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized admin access' });
  }

  next();
};
