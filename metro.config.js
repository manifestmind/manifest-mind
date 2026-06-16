const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase 12 + Expo SDK 54 : désactive la résolution via le champ `exports`
// pour que Metro utilise le champ `react-native` legacy de @firebase/auth
// et expose getReactNativePersistence (sinon → "Cannot read properties of undefined (reading 'bind')").
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
