const rateLimit = require('express-rate-limit');

const GENERAL_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const GENERAL_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10;
const WRITE_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WRITE_WINDOW_MS) || 60 * 60 * 1000;
const WRITE_MAX = parseInt(process.env.RATE_LIMIT_WRITE_MAX) || 30;

const generalLimiter = rateLimit({
  windowMs: GENERAL_WINDOW_MS,
  max: GENERAL_MAX,
  message: {
    error: 'Too many requests, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: GENERAL_WINDOW_MS,
  max: AUTH_MAX,
  message: {
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const writeLimiter = rateLimit({
  windowMs: WRITE_WINDOW_MS,
  max: WRITE_MAX,
  message: {
    error: 'Too many requests, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, writeLimiter };
