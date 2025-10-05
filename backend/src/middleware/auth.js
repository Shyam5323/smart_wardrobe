const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('Server misconfiguration: missing JWT secret.');
    error.status = 500;
    throw error;
  }

  return jwt.verify(token, secret);
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme !== 'Bearer') {
    return res.status(401).json({ message: 'Authorization token missing.' });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    const status = error.status || 401;
    res.status(status).json({ message: status === 401 ? 'Invalid or expired token.' : error.message });
  }
};

authenticate.optional = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme !== 'Bearer') {
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
  } catch (error) {
    // Ignore token errors for optional auth, but clear user context
    req.userId = undefined;
  }

  next();
};

module.exports = authenticate;
