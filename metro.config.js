const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ CRITIQUE: Configuration pour WatermelonDB en production
config.resolver.alias = {
  ...config.resolver.alias,
  '@nozbe/watermelondb/adapters/sqlite': '@nozbe/watermelondb/adapters/sqlite/index.native.js',
};

// ✅ Configuration pour éviter les erreurs de résolution en production
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;
