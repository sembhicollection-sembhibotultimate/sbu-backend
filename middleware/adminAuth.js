module.exports = function adminAuth(req, res, next) {
  try {
    const envKey = String(process.env.ADMIN_API_KEY || '').trim();

    if (!envKey) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_API_KEY is not configured on server'
      });
    }

    const xAdminKey = String(req.headers['x-admin-key'] || '').trim();
    const adminKeyHeader = String(req.headers['admin-key'] || '').trim();
    const authHeader = String(req.headers.authorization || '').trim();
    const queryKey = String(req.query.key || '').trim();

    let providedKey = '';

    if (xAdminKey) {
      providedKey = xAdminKey;
    } else if (adminKeyHeader) {
      providedKey = adminKeyHeader;
    } else if (authHeader) {
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        providedKey = authHeader.slice(7).trim();
      } else {
        providedKey = authHeader;
      }
    } else if (queryKey) {
      providedKey = queryKey;
    }

    if (!providedKey) {
      return res.status(401).json({
        success: false,
        message: 'No admin key provided'
      });
    }

    if (providedKey !== envKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
