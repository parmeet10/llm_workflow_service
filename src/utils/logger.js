// Simple logger utility
export const logger = {
  info: (msg, data = '') => console.log(`ℹ️  [INFO] ${msg}`, data),
  error: (msg, error = '') => console.error(`❌ [ERROR] ${msg}`, error),
  warn: (msg, data = '') => console.warn(`⚠️  [WARN] ${msg}`, data),
  success: (msg, data = '') => console.log(`✅ [SUCCESS] ${msg}`, data),
  debug: (msg, data = '') => process.env.DEBUG && console.log(`🐛 [DEBUG] ${msg}`, data)
};

export default logger;
