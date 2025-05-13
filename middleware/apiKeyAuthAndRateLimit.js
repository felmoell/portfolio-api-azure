// middleware/authRateLimiter.js
const apiKeys = require('../config/apiKeys');

/**
 * Middleware factory with injected rateLimiterMap
 */
module.exports = function createAuthRateLimiter(rateLimiterMap) {
  return function authRateLimiter(req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || !apiKeys[apiKey]) {
      return res.status(403).json({ message: 'Forbidden: Invalid or missing API key' });
    }

    req.apiUser = apiKeys[apiKey];

    const limiter = rateLimiterMap.get(apiKey);
    if (!limiter) {
      return res.status(429).json({ message: 'Rate limiter misconfigured for API key.' });
    }

    limiter(req, res, next);
  };
};