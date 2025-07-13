module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin pour WatermelonDB decorators avec les bonnes options
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true, // Utilise l'ancienne syntaxe pour la compatibilité
        },
      ],
      [
        '@babel/plugin-transform-runtime',
        {
          helpers: true,
          regenerator: false,
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
      // Plugin pour react-native-reanimated (doit être en dernier)
      'react-native-reanimated/plugin',
    ],
  };
};
