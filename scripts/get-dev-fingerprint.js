#!/usr/bin/env node

/**
 * Script pour récupérer l'empreinte SHA-1 de développement
 * Pour ajouter à Google Cloud Console
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Récupération des empreintes SHA-1...\n');

try {
  // Empreinte de développement (debug keystore)
  console.log('📱 EMPREINTE DE DÉVELOPPEMENT (Debug):');
  const debugKeystore = path.join(process.env.HOME || process.env.USERPROFILE, '.android', 'debug.keystore');
  
  try {
    const debugSha1 = execSync(
      `keytool -list -v -keystore "${debugKeystore}" -alias androiddebugkey -storepass android -keypass android | grep "SHA1" | head -1`,
      { encoding: 'utf8' }
    ).trim();
    
    if (debugSha1) {
      const sha1Match = debugSha1.match(/SHA1:\s*([A-F0-9:]+)/);
      if (sha1Match) {
        console.log(`✅ ${sha1Match[1]}`);
        console.log(`   À ajouter dans Google Cloud Console > Credentials > Votre clé API > Restrictions`);
      }
    }
  } catch (error) {
    console.log('❌ Impossible de récupérer l\'empreinte debug');
    console.log('   Keystore debug non trouvé ou keytool non disponible');
  }

  // Empreinte de release (si disponible)
  console.log('\n📱 EMPREINTE DE RELEASE (si configurée):');
  const releaseKeystore = path.join(__dirname, '..', 'android', 'app', 'my-release-key.keystore');
  
  try {
    // Essayer avec différents noms possibles
    const possiblePaths = [
      path.join(__dirname, '..', 'android', 'app', 'my-release-key.keystore'),
      path.join(__dirname, '..', 'android', 'app', 'release.keystore'),
      path.join(__dirname, '..', 'android', 'app', 'app-release.keystore')
    ];
    
    for (const keystorePath of possiblePaths) {
      try {
        const releaseSha1 = execSync(
          `keytool -list -v -keystore "${keystorePath}" -alias my-key-alias`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        
        const sha1Match = releaseSha1.match(/SHA1:\s*([A-F0-9:]+)/);
        if (sha1Match) {
          console.log(`✅ ${sha1Match[1]} (${path.basename(keystorePath)})`);
          break;
        }
      } catch {
        // Ignorer les erreurs et essayer le suivant
      }
    }
  } catch (error) {
    console.log('ℹ️  Keystore de release non configuré (normal en développement)');
  }

  console.log('\n🔧 INSTRUCTIONS:');
  console.log('1. Allez sur Google Cloud Console');
  console.log('2. APIs & Services > Credentials');
  console.log('3. Cliquez sur votre clé API');
  console.log('4. Dans "Application restrictions" > "Android apps"');
  console.log('5. Ajoutez l\'empreinte de développement ci-dessus');
  console.log('6. Sauvegardez les modifications');
  console.log('\n⚠️  IMPORTANT: Gardez aussi l\'empreinte de release pour que l\'app en production fonctionne !');

} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.log('\n💡 Alternative: Créez une clé API séparée pour le développement sans restrictions');
}
