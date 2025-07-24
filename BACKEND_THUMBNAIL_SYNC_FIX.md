# Fix Backend - Synchronisation Thumbnail Entre Endpoints

## 🚨 Problème Identifié

Les endpoints `/accommodations/{id}` et `/steps/{id}` ne sont pas synchronisés :
- Modification via `/accommodations/{id}` → Base MongoDB mise à jour
- Lecture via `/steps/{id}` → Retourne données obsolètes (cache ou agrégation non rafraîchie)

## 📋 Solutions Backend Recommandées

### Option 1: Invalidation Cache Step (RECOMMANDÉE)
```javascript
// Dans le controller accommodations
async updateAccommodation(accommodationId, data) {
  // 1. Mise à jour accommodation
  const updatedAccommodation = await Accommodation.findByIdAndUpdate(
    accommodationId, 
    data, 
    { new: true }
  );
  
  // 2. NOUVEAU: Invalider le cache du step parent
  const stepId = updatedAccommodation.stepId;
  await invalidateStepCache(stepId);
  
  // 3. NOUVEAU: Forcer recalcul des agrégations step
  await refreshStepAggregation(stepId);
  
  return updatedAccommodation;
}

async invalidateStepCache(stepId) {
  // Supprimer du cache Redis/Memory si utilisé
  await cache.del(`step:${stepId}`);
  
  // Marquer pour refresh dans la prochaine requête
  await Step.findByIdAndUpdate(stepId, { 
    needsRefresh: true,
    lastModified: new Date()
  });
}
```

### Option 2: Mise à Jour Step Directe
```javascript
async updateAccommodation(accommodationId, data) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // 1. Mise à jour accommodation
      const accommodation = await Accommodation.findByIdAndUpdate(
        accommodationId, 
        data, 
        { new: true, session }
      );
      
      // 2. NOUVEAU: Mise à jour step.accommodations directement
      await Step.updateOne(
        { _id: accommodation.stepId },
        { 
          $set: { 
            "accommodations.$[elem]": accommodation,
            updatedAt: new Date()
          }
        },
        { 
          arrayFilters: [{ "elem._id": accommodationId }],
          session 
        }
      );
    });
  } finally {
    await session.endSession();
  }
}
```

### Option 3: Event-Driven Architecture
```javascript
// 1. Émettre événement après modification accommodation
await EventEmitter.emit('accommodation.updated', {
  accommodationId,
  stepId: accommodation.stepId,
  changes: data
});

// 2. Listener pour synchroniser step
EventEmitter.on('accommodation.updated', async (event) => {
  await syncStepWithAccommodation(event.stepId, event.accommodationId);
});
```

## 🔍 Points de Vérification Backend

### 1. Agrégation Step
Vérifier si `/steps/{id}` utilise une agrégation MongoDB :
```javascript
// Assurer que l'agrégation récupère les données fraîches
const step = await Step.aggregate([
  { $match: { _id: stepId } },
  {
    $lookup: {
      from: 'accommodations',
      localField: '_id',
      foreignField: 'stepId',
      as: 'accommodations',
      // IMPORTANT: Ne pas utiliser de cache sur cette lookup
      pipeline: [
        { $match: { active: true } }, // Filtrer les données actives
        { $sort: { updatedAt: -1 } }   // Trier par dernière modification
      ]
    }
  }
]);
```

### 2. Cache Strategy
Si un cache est utilisé :
```javascript
// TTL court pour données critiques
const STEP_CACHE_TTL = 60; // 1 minute maximum

// Invalidation lors des modifications
await cache.del(`step:${stepId}`);
await cache.del(`accommodations:step:${stepId}`);
```

### 3. Timestamps Cohérents
```javascript
// S'assurer que tous les timestamps sont cohérents
const now = new Date();

await Promise.all([
  Accommodation.findByIdAndUpdate(accommodationId, { 
    ...data, 
    updatedAt: now 
  }),
  Step.findByIdAndUpdate(stepId, { 
    lastModified: now,
    needsRefresh: true 
  })
]);
```

## 🎯 Solution Immédiate Recommandée

### Quick Fix pour Production
```javascript
// Dans le controller steps
async getStepById(stepId) {
  // 1. Récupérer step de base
  const step = await Step.findById(stepId);
  
  // 2. TOUJOURS récupérer accommodations fraîches (pas de cache)
  const freshAccommodations = await Accommodation.find({ 
    stepId: stepId,
    active: true 
  }).sort({ updatedAt: -1 });
  
  // 3. TOUJOURS récupérer activities fraîches
  const freshActivities = await Activity.find({ 
    stepId: stepId,
    active: true 
  }).sort({ updatedAt: -1 });
  
  // 4. Reconstruire l'objet step avec données fraîches
  return {
    ...step.toObject(),
    accommodations: freshAccommodations,
    activities: freshActivities,
    lastFetched: new Date()
  };
}
```

## 📊 Logs à Ajouter Backend

```javascript
console.log('🔄 Backend - Accommodation mis à jour:', {
  accommodationId,
  stepId: accommodation.stepId,
  thumbnailBefore: oldAccommodation.thumbnail ? 'present' : 'absent',
  thumbnailAfter: updatedAccommodation.thumbnail ? 'present' : 'absent',
  removeThumbnailFlag: data.removeThumbnail
});

console.log('🔄 Backend - Step cache invalidé:', {
  stepId: accommodation.stepId,
  timestamp: new Date().toISOString()
});
```

## ✅ Validation du Fix

Après implémentation backend, vérifier :
1. Modification accommodation → Log "cache invalidé"
2. Lecture step immédiate → Données fraîches retournées
3. Client mobile → Plus de réapparition thumbnail
4. Performance → Pas de dégradation notable

## 🎯 Priorité

**CRITIQUE** - Ce bug affecte l'expérience utilisateur et la cohérence des données. 
Solution recommandée : **Option 1 (Invalidation Cache)** car moins invasive.
