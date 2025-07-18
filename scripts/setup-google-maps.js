#!/usr/bin/env node

/**
 * Script de configuration automatique de la clé Google Maps API
 * Usage: node scripts/setup-google-maps.js YOUR_GOOGLE_API_KEY
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('❌ Erreur: Clé API manquante');
  console.log('Usage: node scripts/setup-google-maps.js YOUR_GOOGLE_API_KEY');
  console.log('Exemple: node scripts/setup-google-maps.js AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw');
  process.exit(1);
}

console.log('🔧 Configuration de la clé Google Maps API...');

// 1. Mise à jour du fichier .env
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');
envContent = envContent.replace(
  /EXPO_PUBLIC_GOOGLE_API_KEY=.*$/m,
  `EXPO_PUBLIC_GOOGLE_API_KEY=${API_KEY}`
);
fs.writeFileSync(envPath, envContent);
console.log('✅ Fichier .env mis à jour');

// 2. Mise à jour du fichier strings.xml
const stringsPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
let stringsContent = fs.readFileSync(stringsPath, 'utf8');
stringsContent = stringsContent.replace(
  /<string name="google_maps_api_key">.*<\/string>/,
  `<string name="google_maps_api_key">${API_KEY}</string>`
);
fs.writeFileSync(stringsPath, stringsContent);
console.log('✅ Fichier strings.xml mis à jour');

console.log('\n🎉 Configuration terminée !');
console.log('\n📝 Prochaines étapes :');
console.log('1. Redémarrez le serveur de développement: npx expo start --clear');
console.log('2. Reconstruisez l\'APK pour le mode release');
console.log('3. Testez les cartes Google Maps dans votre application');

console.log('\n🔍 Vérification de la configuration :');
console.log('- .env:', envContent.includes(API_KEY) ? '✅' : '❌');
console.log('- strings.xml:', stringsContent.includes(API_KEY) ? '✅' : '❌');

console.log('\n⚠️  IMPORTANT pour le mode release :');
console.log('- Assurez-vous que votre clé API est configurée pour Android dans Google Cloud Console');
console.log('- Ajoutez le SHA-1 de votre keystore de release dans Google Cloud Console');
console.log('- Vérifiez que l\'API Places et Maps Android API sont activées');
