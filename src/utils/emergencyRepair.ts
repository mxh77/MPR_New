/**
 * Script de réparation d'urgence pour les boucles infinies
 * À exécuter une fois pour corriger l'état de l'app
 */

/**
 * Commandes ADB pour nettoyer complètement l'état
 */
export const EMERGENCY_REPAIR_COMMANDS = {
  // 1. Vider complètement les données de l'app
  clearAppData: 'adb shell pm clear com.monpetitroadtrip.mpr',
  
  // 2. Redémarrer l'app
  restartApp: 'adb shell am start -n com.monpetitroadtrip.mpr/.MainActivity',
  
  // 3. Vider le cache Expo si nécessaire
  clearExpoCache: 'npx expo start --clear',
};

/**
 * Instructions de réparation d'urgence
 */
export const EMERGENCY_REPAIR_STEPS = [
  '1. Arrêter le serveur de développement (Ctrl+C)',
  '2. Exécuter: adb shell pm clear com.monpetitroadtrip.mpr',
  '3. Redémarrer avec: npx expo start --clear',
  '4. Lancer l\'app et vérifier que les roadtrips se chargent une seule fois'
];

/**
 * Logs à surveiller après réparation
 */
export const EXPECTED_LOGS_AFTER_REPAIR = [
  '✅ Doit voir: "🚀 Initialisation unique des roadtrips..."',
  '✅ Doit voir: Une seule série de logs de chargement',
  '❌ Ne doit PAS voir: "fetchRoadtrips déjà en cours, ignorer l\'appel"',
  '❌ Ne doit PAS voir: "UNIQUE constraint failed"'
];

console.log('🚨 SCRIPT DE RÉPARATION D\'URGENCE');
console.log('📋 Étapes à suivre:');
EMERGENCY_REPAIR_STEPS.forEach((step, index) => {
  console.log(`   ${step}`);
});

console.log('\n🔍 Logs attendus après réparation:');
EXPECTED_LOGS_AFTER_REPAIR.forEach((log) => {
  console.log(`   ${log}`);
});

console.log('\n💾 Commandes ADB importantes:');
Object.entries(EMERGENCY_REPAIR_COMMANDS).forEach(([name, command]) => {
  console.log(`   ${name}: ${command}`);
});
