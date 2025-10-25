// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// SVG 트랜스포머 설정 추가
defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// 에셋 해석기에 SVG 추가
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg');
defaultConfig.resolver.sourceExts = [...defaultConfig.resolver.sourceExts, 'svg'];

module.exports = defaultConfig;
