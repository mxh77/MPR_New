#!/usr/bin/env node

/**
 * Script de vérification de la configuration Google Maps
 * Vérifie que tous les fichiers sont correctement configurés
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Google Maps...\n');

let hasErrors = false;

// 1. Vérification du fichier .env
console.log('📁 Vérification .env');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/EXPO_PUBLIC_GOOGLE_API_KEY=(.+)/);
  
  if (apiKeyMatch) {
    const apiKey = apiKeyMatch[1].trim();
    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || apiKey === 'VOTRE_VRAIE_CLE_API_GOOGLE_ICI') {
      console.log('❌ Clé API non configurée (placeholder détecté)');
      hasErrors = true;
    } else if (apiKey.length < 30) {
      console.log('⚠️  Clé API suspecte (trop courte)');
      hasErrors = true;
    } else {
      console.log('✅ Clé API configurée');
    }
  } else {
    console.log('❌ Variable EXPO_PUBLIC_GOOGLE_API_KEY non trouvée');
    hasErrors = true;
  }
} else {
  console.log('❌ Fichier .env non trouvé');
  hasErrors = true;
}

// 2. Vérification app.config.js
console.log('\n📁 Vérification app.config.js');
const appConfigPath = path.join(__dirname, '..', 'app.config.js');
if (fs.existsSync(appConfigPath)) {
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  if (appConfigContent.includes('process.env.EXPO_PUBLIC_GOOGLE_API_KEY')) {
    console.log('✅ Configuration Android trouvée');
  } else {
    console.log('❌ Configuration Android manquante');
    hasErrors = true;
  }
  
  if (appConfigContent.includes('googleMapsApiKey')) {
    console.log('✅ Configuration iOS trouvée');
  } else {
    console.log('❌ Configuration iOS manquante');
    hasErrors = true;
  }
} else {
  console.log('❌ Fichier app.config.js non trouvé');
  hasErrors = true;
}

// 3. Vérification AndroidManifest.xml
console.log('\n📁 Vérification AndroidManifest.xml');
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  if (manifestContent.includes('com.google.android.geo.API_KEY')) {
    if (manifestContent.includes('YOUR_GOOGLE_MAPS_API_KEY_HERE')) {
      console.log('❌ Placeholder détecté dans AndroidManifest.xml');
      hasErrors = true;
    } else {
      console.log('✅ Configuration AndroidManifest.xml trouvée');
    }
  } else {
    console.log('❌ Meta-data Google Maps manquante');
    hasErrors = true;
  }
} else {
  console.log('❌ AndroidManifest.xml non trouvé');
  hasErrors = true;
}

// 4. Vérification strings.xml
console.log('\n📁 Vérification strings.xml');
const stringsPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
if (fs.existsSync(stringsPath)) {
  const stringsContent = fs.readFileSync(stringsPath, 'utf8');
  
  if (stringsContent.includes('google_maps_api_key')) {
    if (stringsContent.includes('VOTRE_VRAIE_CLE_API_GOOGLE_ICI')) {
      console.log('❌ Placeholder détecté dans strings.xml');
      hasErrors = true;
    } else {
      console.log('✅ Configuration strings.xml trouvée');
    }
  } else {
    console.log('❌ google_maps_api_key manquante dans strings.xml');
    hasErrors = true;
  }
} else {
  console.log('❌ strings.xml non trouvé');
  hasErrors = true;
}

// 5. Vérification des composants
console.log('\n📁 Vérification des composants');
const googlePlacesPath = path.join(__dirname, '..', 'src', 'components', 'common', 'GooglePlacesInput.tsx');
if (fs.existsSync(googlePlacesPath)) {
  const googlePlacesContent = fs.readFileSync(googlePlacesPath, 'utf8');
  
  if (googlePlacesContent.includes('ENV.GOOGLE_API_KEY')) {
    console.log('✅ GooglePlacesInput utilise ENV.GOOGLE_API_KEY');
  } else {
    console.log('⚠️  GooglePlacesInput n\'utilise pas ENV.GOOGLE_API_KEY');
  }
} else {
  console.log('❌ GooglePlacesInput.tsx non trouvé');
}

// Résumé
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Configuration incomplète détectée !');
  console.log('\n📝 Actions recommandées :');
  console.log('1. Obtenez une clé API Google Maps sur https://console.cloud.google.com/');
  console.log('2. Exécutez : node scripts/setup-google-maps.js VOTRE_CLE_API');
  console.log('3. Redémarrez : npx expo start --clear');
  console.log('4. Reconstruisez l\'APK release');
} else {
  console.log('✅ Configuration complète !');
  console.log('\n📝 Prochaines étapes :');
  console.log('1. Vérifiez que les APIs sont activées dans Google Cloud Console');
  console.log('2. Configurez les restrictions d\'API et d\'application');
  console.log('3. Testez sur un device/émulateur');
}
console.log('='.repeat(50));
