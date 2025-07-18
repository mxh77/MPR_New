/**
 * Test simple pour vérifier l'API Google Places
 */
import ENV from '../src/config/env';

const testGooglePlacesAPI = async () => {
  console.log('🧪 Test Google Places API');
  console.log('Clé API:', ENV.GOOGLE_API_KEY ? `${ENV.GOOGLE_API_KEY.substring(0, 10)}...` : 'MANQUANTE');
  
  if (!ENV.GOOGLE_API_KEY) {
    console.error('❌ Clé API Google manquante');
    return;
  }
  
  try {
    const testInput = 'Paris';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(testInput)}&key=${ENV.GOOGLE_API_KEY}&language=fr`;
    
    console.log('🌐 Appel API:', url.replace(ENV.GOOGLE_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📡 Réponse API:', {
      status: data.status,
      predictions: data.predictions?.length || 0,
      error: data.error_message || 'aucune'
    });
    
    if (data.status !== 'OK') {
      console.error('❌ Erreur API:', data.error_message || data.status);
    } else {
      console.log('✅ API fonctionnelle');
      console.log('📍 Premières suggestions:');
      data.predictions.slice(0, 3).forEach((pred, i) => {
        console.log(`  ${i + 1}. ${pred.description}`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
};

// Exporter pour utilisation
export { testGooglePlacesAPI };

// Auto-test si exécuté directement
if (require.main === module) {
  testGooglePlacesAPI();
}
