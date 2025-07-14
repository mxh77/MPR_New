const IS_DEV = process.env.BUILD_TYPE === 'debug';

export default {
  expo: {
    name: IS_DEV ? "MPR Dev" : "Mon Petit Roadtrip 2",
    slug: IS_DEV ? "mpr-dev" : "monpetitroadtrip2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo_sans_texte.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    plugins: ["expo-dev-client"],
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      package: IS_DEV 
        ? "com.mxh7777.mpr.dev" 
        : "com.mxh7777.monpetitroadtrip2",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    ios: {
      bundleIdentifier: IS_DEV 
        ? "com.mxh7777.mpr.dev" 
        : "com.mxh7777.monpetitroadtrip2",
      supportsTablet: true
    }
  }
};