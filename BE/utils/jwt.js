const jwt = require('jsonwebtoken');

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '15m'
  });
};

const createRefreshToken = (payload = {}) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
    expiresIn: '7d'
  });
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken
};
