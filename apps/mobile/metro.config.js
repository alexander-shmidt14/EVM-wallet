const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Добавляем поддержку workspace packages
config.watchFolders = [
  path.resolve(__dirname, '../../'),
];

// Настройка резолвера для монорепо
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, '../../node_modules'),
  path.resolve(__dirname, 'node_modules'),
];

config.resolver.alias = {
  crypto: 'react-native-quick-crypto',
  stream: 'stream-browserify',
  buffer: '@craftzdog/react-native-buffer',
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
