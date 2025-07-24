# 🚨 INSTRUCTIONS BACKEND - Fix Synchronisation Thumbnail

## 📋 Problème à Résoudre

**Bug critique** : Suppression thumbnail fonctionne via `/accommodations/{id}` mais réapparaît lors de récupération via `/steps/{id}`

### Symptômes
- ✅ Mobile envoie `removeThumbnail: true` à `/accommodations/{id}`
- ✅ API accommodation met à jour la base MongoDB
- ❌ API `/steps/{id}` retourne encore l'ancienne thumbnail
- ❌ Utilisateur voit sa thumbnail supprimée réapparaître

## 🎯 Solution à Implémenter (PRIORITÉ CRITIQUE)

### Étape 1: Identifier le Code Backend Actuel

Localiser ces fichiers/endpoints :
```
- Controller/Route: PUT /accommodations/{id}
- Controller/Route: GET /steps/{id}  
- Model: Accommodation
- Model: Step
```

### Étape 2: Modifier le Controller Accommodation

**Fichier à modifier** : `accommodations.controller.js` (ou équivalent)

**Action** : Ajouter invalidation cache step après mise à jour accommodation

```javascript
// AVANT (code actuel)
async updateAccommodation(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    res.json(updatedAccommodation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// APRÈS (code modifié) - AJOUTER CES LIGNES
async updateAccommodation(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 1. Mise à jour accommodation (code existant)
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    // 2. NOUVEAU: Invalider le cache/agrégation du step parent
    if (updatedAccommodation.stepId) {
      await this.invalidateStepCache(updatedAccommodation.stepId);
    }
    
    // 3. NOUVEAU: Log pour debugging
    console.log('🔄 Backend - Accommodation mis à jour:', {
      accommodationId: id,
      stepId: updatedAccommodation.stepId,
      thumbnailRemoved: updateData.removeThumbnail || false,
      timestamp: new Date().toISOString()
    });
    
    res.json(updatedAccommodation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 4. NOUVEAU: Ajouter cette méthode d'invalidation
async invalidateStepCache(stepId) {
  try {
    // Option A: Si vous utilisez un cache Redis/Memory
    if (this.cache) {
      await this.cache.del(`step:${stepId}`);
      await this.cache.del(`step:aggregated:${stepId}`);
    }
    
    // Option B: Marquer le step pour refresh forcé
    await Step.findByIdAndUpdate(stepId, {
      needsRefresh: true,
      lastModified: new Date()
    });
    
    console.log('🔄 Backend - Step cache invalidé:', {
      stepId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur invalidation cache step:', error);
  }
}
```

### Étape 3: Modifier le Controller Steps

**Fichier à modifier** : `steps.controller.js` (ou équivalent)

**Action** : Forcer récupération données fraîches accommodations

```javascript
// AVANT (code actuel - probablement quelque chose comme ça)
async getStepById(req, res) {
  try {
    const { id } = req.params;
    
    // Récupération avec cache ou agrégation
    const step = await Step.findById(id)
      .populate('accommodations')
      .populate('activities');
    
    res.json(step);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// APRÈS (code modifié) - REMPLACER PAR
async getStepById(req, res) {
  try {
    const { id } = req.params;
    
    // 1. Récupérer step de base
    const step = await Step.findById(id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    // 2. NOUVEAU: TOUJOURS récupérer accommodations fraîches (pas de cache)
    const freshAccommodations = await Accommodation.find({ 
      stepId: id,
      active: true 
    }).sort({ updatedAt: -1 });
    
    // 3. NOUVEAU: TOUJOURS récupérer activities fraîches
    const freshActivities = await Activity.find({ 
      stepId: id,
      active: true 
    }).sort({ updatedAt: -1 });
    
    // 4. Reconstruire l'objet step avec données fraîches
    const stepWithFreshData = {
      ...step.toObject(),
      accommodations: freshAccommodations,
      activities: freshActivities,
      lastFetched: new Date()
    };
    
    // 5. Log pour debugging
    console.log('🔄 Backend - Step récupéré avec données fraîches:', {
      stepId: id,
      accommodationsCount: freshAccommodations.length,
      activitiesCount: freshActivities.length,
      accommodationsHaveThumbnails: freshAccommodations.map(acc => ({
        id: acc._id,
        name: acc.name,
        hasThumbnail: !!acc.thumbnail
      }))
    });
    
    res.json(stepWithFreshData);
  } catch (error) {
    console.error('Erreur getStepById:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Étape 4: Gérer le Flag removeThumbnail (CRITIQUE - MANQUANT ACTUELLEMENT)

**PROBLÈME IDENTIFIÉ** : L'API PUT `/accommodations/{id}` ne gère pas le flag `removeThumbnail` envoyé par le mobile.

**Dans le controller accommodation**, ajouter cette logique AVANT la sauvegarde :

```javascript
// AJOUTER AU DÉBUT de updateAccommodation, avant findByIdAndUpdate
async updateAccommodation(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // 🚨 NOUVEAU: Gérer le flag removeThumbnail envoyé par le mobile
    if (updateData.removeThumbnail === true) {
      console.log('🗑️ Backend - Flag removeThumbnail détecté, suppression thumbnail');
      
      // Supprimer explicitement la thumbnail de la base
      updateData.thumbnail = null;
      updateData.$unset = { thumbnail: 1 }; // MongoDB : supprimer le champ complètement
      
      // Nettoyer le flag pour ne pas le sauvegarder en base
      delete updateData.removeThumbnail;
      
      console.log('🗑️ Backend - Thumbnail marquée pour suppression');
    }
    
    // Log pour debugging mobile
    console.log('🔄 Backend - Données reçues accommodation:', {
      accommodationId: id,
      hasRemoveThumbnailFlag: req.body.removeThumbnail === true,
      hasThumbnailData: !!updateData.thumbnail,
      updateDataKeys: Object.keys(updateData)
    });
    
    // Continuer avec le code existant...
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    // ... reste du code
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Alternative si la méthode $unset ne fonctionne pas** :
```javascript
if (updateData.removeThumbnail === true) {
  // Option 1: Utiliser findByIdAndUpdate avec $unset
  const updatedAccommodation = await Accommodation.findByIdAndUpdate(
    id,
    { 
      ...updateData,
      $unset: { thumbnail: 1 }
    },
    { new: true }
  );
  
  // Option 2: Ou faire une mise à jour en 2 étapes
  await Accommodation.findByIdAndUpdate(id, { $unset: { thumbnail: 1 } });
  const updatedAccommodation = await Accommodation.findByIdAndUpdate(
    id, 
    updateData, 
    { new: true }
  );
}
```

## 🧪 Tests de Validation

### Test 1: Suppression Thumbnail avec removeThumbnail
```bash
# 1. Tester d'abord sans le flag (doit conserver thumbnail)
curl -X PUT /api/accommodations/ACCOMMODATION_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hotel Updated"}'

# 2. Tester avec le flag removeThumbnail (doit supprimer thumbnail)
curl -X PUT /api/accommodations/ACCOMMODATION_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hotel","removeThumbnail":true}'

# 3. Vérifier que l'accommodation n'a plus de thumbnail
curl -X GET /api/accommodations/ACCOMMODATION_ID

# 4. Vérifier que step retourne accommodation sans thumbnail
curl -X GET /api/steps/STEP_ID

# Résultat attendu: accommodation.thumbnail doit être null/undefined dans les deux cas
```

### Test 2: Logs Backend (NOUVEAUX)
Vérifier ces logs après envoi de `removeThumbnail: true` :
```
🔄 Backend - Données reçues accommodation: {accommodationId, hasRemoveThumbnailFlag: true, hasThumbnailData: false}
�️ Backend - Flag removeThumbnail détecté, suppression thumbnail
🗑️ Backend - Thumbnail marquée pour suppression  
🔄 Backend - Accommodation mis à jour: {accommodationId, stepId, thumbnailRemoved: true}
🔄 Backend - Step cache invalidé: {stepId, timestamp}
```

## ⚡ Solution Alternative (Si la première ne fonctionne pas)

### Transaction Atomique
```javascript
async updateAccommodation(req, res) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // 1. Mise à jour accommodation
      const accommodation = await Accommodation.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, session }
      );
      
      // 2. Mise à jour step.accommodations directement
      await Step.updateOne(
        { _id: accommodation.stepId },
        { 
          $set: { 
            "accommodations.$[elem]": accommodation,
            updatedAt: new Date()
          }
        },
        { 
          arrayFilters: [{ "elem._id": req.params.id }],
          session 
        }
      );
    });
    
    res.json(updatedAccommodation);
  } finally {
    await session.endSession();
  }
}
```

## 📊 Points de Contrôle

### Avant déploiement, vérifier :
- [ ] Modification accommodation → Log "cache invalidé"
- [ ] Endpoint `/steps/{id}` → Toujours données fraîches
- [ ] Flag `removeThumbnail: true` → Thumbnail supprimée en base
- [ ] Performance → Pas de dégradation notable
- [ ] Tests mobile → Plus de réapparition thumbnail

## 🚨 Notes Importantes

1. **Backup** : Sauvegarder la base avant modification
2. **Tests** : Tester en environnement dev avant prod  
3. **Performance** : Surveiller les temps de réponse après modification
4. **Logs** : Ajouter les logs pour debugging mobile
5. **Rollback** : Prévoir plan de retour arrière si problèmes

## 📞 Support Mobile

Si problème persiste après implémentation backend :
- Mobile a une protection temporaire active
- Vérifier logs backend pour validation
- Mobile peut désactiver protection une fois backend fixé

---

**🎯 OBJECTIF** : Après cette modification, la suppression thumbnail via mobile doit être persistante et ne plus réapparaître lors du rafraîchissement.
