module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/features': './src/features',
            '@/core': './src/core',
            '@/services': './src/services',
            '@/state': './src/state',
            '@/shared': './src/shared',
            '@/types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
