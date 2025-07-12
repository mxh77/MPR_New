module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin pour WatermelonDB
      '@babel/plugin-proposal-decorators',
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: true,
          regenerator: false,
        },
      ],
      // Plugin pour react-native-reanimated
      [
        'react-native-reanimated/plugin',
        {
          relativeSourceLocation: true,
        },
      ],
      // Plugin pour styled-components
      [
        'babel-plugin-styled-components',
        {
          displayName: true,
          fileName: false,
        },
      ],
    ],
  };
};
