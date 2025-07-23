/**
 * Test de la fonctionnalité de navigation inter-étapes
 * À exécuter dans un simulateur pour vérifier le comportement
 */

// Test des données d'exemple
const testSteps = [
  {
    _id: 'step1',
    title: 'Paris - Louvre',
    type: 'Stage',
    location: {
      latitude: 48.8606,
      longitude: 2.3376,
      address: 'Musée du Louvre, Paris'
    },
    accommodations: [
      {
        _id: 'hotel1',
        name: 'Hôtel Le Meurice',
        latitude: 48.8650,
        longitude: 2.3284,
        address: '228 Rue de Rivoli, 75001 Paris',
        active: true,
        arrivalDateTime: '2024-07-20T15:00:00Z',
        departureDateTime: '2024-07-21T11:00:00Z'
      }
    ],
    activities: [
      {
        _id: 'activity1',
        name: 'Visite du Louvre',
        latitude: 48.8606,
        longitude: 2.3376,
        address: 'Musée du Louvre, 75001 Paris',
        active: true,
        arrivalDateTime: '2024-07-20T10:00:00Z',
        departureDateTime: '2024-07-20T17:00:00Z'
      }
    ]
  },
  {
    _id: 'step2',
    title: 'Lyon - Vieux Lyon',
    type: 'Stage',
    location: {
      latitude: 45.7640,
      longitude: 4.8357,
      address: 'Vieux Lyon, Lyon'
    },
    accommodations: [
      {
        _id: 'hotel2',
        name: 'Hôtel des Artistes',
        latitude: 45.7640,
        longitude: 4.8357,
        address: '8 Rue Gaspard André, 69005 Lyon',
        active: true,
        arrivalDateTime: '2024-07-21T16:00:00Z',
        departureDateTime: '2024-07-22T10:00:00Z'
      }
    ],
    activities: [
      {
        _id: 'activity2',
        name: 'Balade dans le Vieux Lyon',
        latitude: 45.7640,
        longitude: 4.8357,
        address: 'Vieux Lyon, 69005 Lyon',
        active: true,
        arrivalDateTime: '2024-07-21T14:00:00Z',
        departureDateTime: '2024-07-21T18:00:00Z'
      }
    ]
  }
];

console.log('🧪 Test des fonctions de navigation inter-étapes');

// Test 1: Extraction du dernier point d'un step
console.log('\n=== Test 1: Dernier point du Step 1 ===');
// Le dernier point devrait être l'hôtel (départ à 11h) car c'est après l'activité (fin à 17h le jour précédent)

// Test 2: Extraction du premier point d'un step  
console.log('\n=== Test 2: Premier point du Step 2 ===');
// Le premier point devrait être l'activité (arrivée à 14h) car c'est avant l'hôtel (arrivée à 16h)

// Test 3: Construction de l'URL Google Maps
console.log('\n=== Test 3: URL Google Maps attendue ===');
console.log('Départ: Hôtel Le Meurice (48.8650, 2.3284)');
console.log('Arrivée: Balade dans le Vieux Lyon (45.7640, 4.8357)');
console.log('URL: https://www.google.com/maps/dir/48.8650,2.3284/45.7640,4.8357');

// Test 4: Cas d'erreur - Step sans coordonnées
const stepSansCoords = {
  _id: 'step3',
  title: 'Étape sans coordonnées',
  type: 'Stage',
  accommodations: [],
  activities: []
};

console.log('\n=== Test 4: Gestion des erreurs ===');
console.log('Step sans coordonnées:', stepSansCoords.title);

export {
  testSteps,
  stepSansCoords
};
