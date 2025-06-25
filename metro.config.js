const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add network configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure network timeouts
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Add CORS headers for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return middleware(req, res, next);
    };
  },
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config; 