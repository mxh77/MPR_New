# 🚨 FIX PRIORITAIRE - Backend removeThumbnail

## ⚡ Problème Identifié

L'API `PUT /accommodations/{id}` **ne gère PAS** le flag `removeThumbnail` envoyé par le mobile.

### Ce que fait actuellement le mobile :
```json
{
  "name": "Hôtel",
  "address": "Paris, France", 
  "removeThumbnail": true  ← FLAG IGNORÉ PAR LE BACKEND
}
```

### Ce qu'il faut ajouter au backend :

## 🔧 Code à Ajouter (Controller Accommodation)

```javascript
async updateAccommodation(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // 🚨 AJOUTER CETTE LOGIQUE (MANQUANTE ACTUELLEMENT)
    if (updateData.removeThumbnail === true) {
      console.log('🗑️ Backend - Flag removeThumbnail détecté, suppression thumbnail');
      
      // Supprimer la thumbnail de MongoDB
      updateData.$unset = { thumbnail: 1 };
      
      // Nettoyer le flag
      delete updateData.removeThumbnail;
      
      console.log('🗑️ Backend - Thumbnail marquée pour suppression');
    }
    
    // Log debug pour mobile
    console.log('🔄 Backend - Données reçues:', {
      accommodationId: id,
      hasRemoveThumbnailFlag: req.body.removeThumbnail === true,
      updateDataKeys: Object.keys(updateData)
    });
    
    // Code existant...
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
```

## 🧪 Test Rapide

```bash
# Envoyer flag removeThumbnail
curl -X PUT /api/accommodations/ACCOMMODATION_ID \
  -H "Content-Type: application/json" \
  -d '{"removeThumbnail":true}'

# Vérifier suppression
curl -X GET /api/accommodations/ACCOMMODATION_ID
# Résultat attendu: pas de propriété thumbnail
```

## 📊 Logs Attendus

```
🗑️ Backend - Flag removeThumbnail détecté, suppression thumbnail
🔄 Backend - Données reçues: {hasRemoveThumbnailFlag: true}
🗑️ Backend - Thumbnail marquée pour suppression
```

**🎯 PRIORITÉ ABSOLUE** : Sans ce fix, la suppression thumbnail ne fonctionnera jamais !
