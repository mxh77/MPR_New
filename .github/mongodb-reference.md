# RÉFÉRENCE RAPIDE - MODÈLES MONGODB MPR_New

> 📋 **Utilisation** : Attachez ce fichier dans vos conversations Copilot quand vous travaillez sur les données

## 🎯 Types API Exacts (à utiliser tel quel)

### Step Types
```typescript
type: "Stage" | "Stop"  // ⚠️ EXACTEMENT ces valeurs
```

### Activity Types
```typescript
type: "hiking" | "visit" | "restaurant" | "accommodation" | "transport" | "other"
```

### Travel Time Notes
```typescript
travelTimeNote: "ERROR" | "WARNING" | "OK"  // ⚠️ EXACTEMENT ces valeurs
```

## 📋 SCHÉMAS MONGODB COMPLETS

# Documentation des Modèles - MonPetitRoadtrip

Cette documentation présente tous les modèles de données utilisés dans l'application MonPetitRoadtrip.

## Table des Matières

1. [Modèles Principaux](#modèles-principaux)
   - [User](#user)
   - [Roadtrip](#roadtrip)
   - [Step](#step)
   - [Activity](#activity)
   - [Accommodation](#accommodation)
2. [Modèles de Fichiers](#modèles-de-fichiers)
   - [File](#file)
3. [Modèles de Communication](#modèles-de-communication)
   - [ChatHistory](#chathistory)
   - [Notification](#notification)
4. [Modèles de Configuration](#modèles-de-configuration)
   - [UserSetting](#usersetting)
5. [Modèles de Tâches](#modèles-de-tâches)
   - [RoadtripTask](#roadtriptask)
6. [Modèles de Jobs/Traitement Asynchrone](#modèles-de-jobstraitement-asynchrone)
   - [AIRoadtripJob](#airoadtripjob)
   - [ChatbotJob](#chatbotjob)
   - [StepSyncJob](#stepsyncjob)
   - [TravelTimeJob](#traveltimejob)
   - [TaskGenerationJob](#taskgenerationjob)
   - [StepStoryJob](#stepstoryjob)
   - [AITaskJob](#aitaskjob)
7. [Modèles Dépréciés](#modèles-dépréciés)
   - [Stage](#stage-déprécié)
   - [Stop](#stop-déprécié)

---

## Modèles Principaux

### User
**Fichier :** `server/models/User.js`

Modèle représentant les utilisateurs de l'application.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `username` | String | ✅ | Nom d'utilisateur unique |
| `email` | String | ✅ | Adresse email unique |
| `password` | String | ✅ | Mot de passe haché |
| `resetPasswordToken` | String | ❌ | Token de réinitialisation de mot de passe |
| `resetPasswordExpires` | Date | ❌ | Date d'expiration du token |
| `dateCreated` | Date | ❌ | Date de création du compte (défaut: maintenant) |

**Relations :**
- Un utilisateur peut avoir plusieurs roadtrips
- Un utilisateur peut avoir des paramètres personnalisés (UserSetting)

---

### Roadtrip
**Fichier :** `server/models/Roadtrip.js`

Modèle principal représentant un voyage.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur propriétaire |
| `name` | String | ✅ | Nom du roadtrip |
| `startLocation` | String | ❌ | Lieu de départ |
| `startDateTime` | Date | ❌ | Date/heure de départ |
| `endLocation` | String | ❌ | Lieu d'arrivée |
| `endDateTime` | Date | ❌ | Date/heure d'arrivée |
| `currency` | String | ❌ | Devise (défaut: 'EUR') |
| `notes` | String | ❌ | Notes générales |
| `photos` | [ObjectId] | ❌ | Références vers des fichiers photo |
| `documents` | [ObjectId] | ❌ | Références vers des documents |
| `thumbnail` | ObjectId | ❌ | Image de miniature |
| `steps` | [ObjectId] | ❌ | Liste des étapes du roadtrip |

**Relations :**
- Appartient à un utilisateur (User)
- Contient plusieurs étapes (Step)
- Peut contenir des fichiers (File)

---

### Step
**Fichier :** `server/models/Step.js`

Modèle représentant une étape du roadtrip (remplace Stage/Stop).

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `type` | String | ❌ | Type d'étape ('Stage' ou 'Stop') |
| `name` | String | ❌ | Nom de l'étape |
| `address` | String | ❌ | Adresse de l'étape |
| `latitude` | Number | ❌ | Coordonnée latitude |
| `longitude` | Number | ❌ | Coordonnée longitude |
| `arrivalDateTime` | Date | ❌ | Date/heure d'arrivée |
| `departureDateTime` | Date | ❌ | Date/heure de départ |
| `travelTimePreviousStep` | Number | ❌ | Temps de trajet depuis l'étape précédente |
| `distancePreviousStep` | Number | ❌ | Distance depuis l'étape précédente |
| `isArrivalTimeConsistent` | Boolean | ❌ | Cohérence des horaires (défaut: true) |
| `travelTimeNote` | String | ❌ | Note sur le temps de trajet ('ERROR', 'WARNING', 'OK') |
| `notes` | String | ❌ | Notes sur l'étape |
| `photos` | [ObjectId] | ❌ | Photos de l'étape |
| `documents` | [ObjectId] | ❌ | Documents liés |
| `thumbnail` | ObjectId | ❌ | Image miniature |
| `accommodations` | [ObjectId] | ❌ | Hébergements (seulement si type='Stage') |
| `activities` | [ObjectId] | ❌ | Activités (seulement si type='Stage') |
| `story` | String | ❌ | Récit généré par IA |

**Validations :**
- Les hébergements et activités ne sont autorisés que pour les étapes de type 'Stage'

**Relations :**
- Appartient à un utilisateur (User) et un roadtrip (Roadtrip)
- Peut contenir des hébergements (Accommodation) et activités (Activity)

---

### Activity
**Fichier :** `server/models/Activity.js`

Modèle représentant une activité dans une étape.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `stepId` | ObjectId | ✅ | Référence vers l'étape |
| `active` | Boolean | ❌ | Activité active/archivée (défaut: true) |
| `type` | String | ❌ | Type d'activité ('Randonnée', 'Courses', 'Visite', 'Transport', 'Autre') |
| `name` | String | ✅ | Nom de l'activité |
| `address` | String | ❌ | Adresse de l'activité |
| `latitude` | Number | ❌ | Coordonnée latitude |
| `longitude` | Number | ❌ | Coordonnée longitude |
| `website` | String | ❌ | Site web |
| `phone` | String | ❌ | Numéro de téléphone |
| `email` | String | ❌ | Email de contact |
| `startDateTime` | Date | ❌ | Date/heure de début |
| `endDateTime` | Date | ❌ | Date/heure de fin |
| `duration` | Number | ❌ | Durée de l'activité |
| `typeDuration` | String | ❌ | Unité de durée ('M', 'H', 'J') |
| `reservationNumber` | String | ❌ | Numéro de réservation |
| `price` | Number | ❌ | Prix de l'activité |
| `currency` | String | ❌ | Devise ('USD', 'CAD', 'EUR') |
| `trailDistance` | Number | ❌ | Distance de randonnée (km) |
| `trailElevation` | Number | ❌ | Dénivelé de randonnée (m) |
| `trailType` | String | ❌ | Type de sentier |
| `notes` | String | ❌ | Notes sur l'activité |
| `photos` | [ObjectId] | ❌ | Photos de l'activité |
| `documents` | [ObjectId] | ❌ | Documents liés |
| `thumbnail` | ObjectId | ❌ | Image miniature |
| `algoliaId` | String | ❌ | ID Algolia pour la recherche |

**Relations :**
- Appartient à un utilisateur (User) et une étape (Step)

---

### Accommodation
**Fichier :** `server/models/Accommodation.js`

Modèle représentant un hébergement dans une étape.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `stepId` | ObjectId | ✅ | Référence vers l'étape |
| `active` | Boolean | ❌ | Hébergement actif/archivé (défaut: true) |
| `name` | String | ✅ | Nom de l'hébergement |
| `address` | String | ❌ | Adresse de l'hébergement |
| `latitude` | Number | ❌ | Coordonnée latitude |
| `longitude` | Number | ❌ | Coordonnée longitude |
| `website` | String | ❌ | Site web |
| `phone` | String | ❌ | Numéro de téléphone |
| `email` | String | ❌ | Email de contact |
| `reservationNumber` | String | ❌ | Numéro de réservation |
| `confirmationDateTime` | Date | ❌ | Date/heure de confirmation |
| `arrivalDateTime` | Date | ❌ | Date/heure d'arrivée |
| `departureDateTime` | Date | ❌ | Date/heure de départ |
| `nights` | Number | ❌ | Nombre de nuits |
| `price` | Number | ❌ | Prix de l'hébergement |
| `currency` | String | ❌ | Devise ('USD', 'CAD', 'EUR') |
| `notes` | String | ❌ | Notes sur l'hébergement |
| `photos` | [ObjectId] | ❌ | Photos de l'hébergement |
| `documents` | [ObjectId] | ❌ | Documents liés |
| `thumbnail` | ObjectId | ❌ | Image miniature |

**Relations :**
- Appartient à un utilisateur (User) et une étape (Step)

---

## Modèles de Fichiers

### File
**Fichier :** `server/models/File.js`

Modèle représentant les fichiers (photos, documents, thumbnails).

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `fileId` | String | ❌ | Identifiant unique UUID |
| `name` | String | ❌ | Nom du fichier |
| `url` | String | ✅ | URL d'accès au fichier |
| `type` | String | ✅ | Type de fichier ('photo', 'document', 'thumbnail') |
| `createdAt` | Date | ❌ | Date de création (défaut: maintenant) |

**Relations :**
- Peut être référencé par Roadtrip, Step, Activity, Accommodation

---

## Modèles de Communication

### ChatHistory
**Fichier :** `server/models/ChatHistory.js`

Modèle gérant l'historique des conversations avec le chatbot.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `conversationId` | String | ✅ | Identifiant unique de conversation |
| `messages` | Array | ❌ | Liste des messages |
| `context` | Object | ❌ | Contexte de la conversation |
| `title` | String | ❌ | Titre de la conversation |
| `summary` | String | ❌ | Résumé de la conversation |
| `isActive` | Boolean | ❌ | Conversation active (défaut: true) |

**Structure des messages :**
- `role`: 'user', 'assistant', 'system'
- `content`: Contenu du message
- `timestamp`: Horodatage
- `intent`: Intention détectée (pour assistant)
- `entities`: Entités extraites
- `jobId`: Référence vers le job associé

**Méthodes :**
- `addMessage(role, content, metadata)`: Ajouter un message
- `generateTitle()`: Générer un titre automatiquement

---

### Notification
**Fichier :** `server/models/Notification.js`

Modèle gérant les notifications utilisateur.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ❌ | Référence vers le roadtrip (optionnel) |
| `type` | String | ✅ | Type ('chatbot_success', 'chatbot_error', 'system', 'reminder') |
| `title` | String | ✅ | Titre de la notification |
| `message` | String | ✅ | Message de la notification |
| `icon` | String | ❌ | Icône ('success', 'error', 'warning', 'info') |
| `data` | Mixed | ❌ | Données additionnelles |
| `relatedJobId` | ObjectId | ❌ | Référence vers un job |
| `read` | Boolean | ❌ | Notification lue (défaut: false) |
| `readAt` | Date | ❌ | Date de lecture |
| `expiresAt` | Date | ❌ | Expiration automatique (7 jours) |

**Fonctionnalités :**
- Expiration automatique après 7 jours
- Index pour optimiser les performances
- Support TTL MongoDB

---

## Modèles de Configuration

### UserSetting
**Fichier :** `server/models/UserSetting.js`

Modèle gérant les paramètres personnalisés de l'utilisateur.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur (unique) |
| `systemPrompt` | String | ❌ | Prompt système personnalisé pour l'IA |
| `algoliaSearchRadius` | Number | ❌ | Rayon de recherche Algolia (1km-200km, défaut: 50km) |
| `dragSnapInterval` | Number | ❌ | Intervalle de déplacement planning (5,10,15,30,60 min) |
| `enablePhotosInStories` | Boolean | ❌ | Activer l'analyse photos dans les récits (défaut: true) |

**Contraintes :**
- Un seul paramétrage par utilisateur
- Rayon Algolia limité entre 1km et 200km
- Intervalles de déplacement prédéfinis

---

## Modèles de Tâches

### RoadtripTask
**Fichier :** `server/models/RoadtripTask.js`

Modèle gérant les tâches de préparation du roadtrip.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `title` | String | ✅ | Titre de la tâche (max 200 caractères) |
| `description` | String | ❌ | Description détaillée (max 1000 caractères) |
| `category` | String | ❌ | Catégorie de tâche |
| `priority` | String | ❌ | Priorité ('low', 'medium', 'high', 'urgent') |
| `status` | String | ❌ | Statut ('pending', 'in_progress', 'completed', 'cancelled') |
| `dueDate` | Date | ❌ | Date d'échéance |
| `completedAt` | Date | ❌ | Date de completion |
| `assignedTo` | String | ❌ | Personne responsable |
| `estimatedDuration` | Number | ❌ | Durée estimée (minutes) |
| `reminderDate` | Date | ❌ | Date de rappel |
| `attachments` | [ObjectId] | ❌ | Fichiers joints |
| `notes` | String | ❌ | Notes additionnelles (max 2000 caractères) |
| `order` | Number | ❌ | Ordre d'affichage |
| `isRecurring` | Boolean | ❌ | Tâche récurrente |
| `recurringPattern` | String | ❌ | Motif de récurrence ('daily', 'weekly', 'monthly') |

**Catégories disponibles :**
- `preparation`: Préparation du voyage
- `booking`: Réservations
- `packing`: Bagages
- `documents`: Documents/papiers
- `transport`: Transport
- `accommodation`: Hébergement
- `activities`: Activités
- `health`: Santé/médicaments
- `finances`: Finances
- `communication`: Communication
- `other`: Autre

---

## Modèles de Jobs/Traitement Asynchrone

### AIRoadtripJob
**Fichier :** `server/models/AIRoadtripJob.js`

Modèle gérant les jobs de génération automatique de roadtrips par IA.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `status` | String | ❌ | Statut du job |
| `currentStep` | Number | ❌ | Étape actuelle |
| `totalSteps` | Number | ❌ | Nombre total d'étapes |
| `progress` | Object | ❌ | Informations de progression |
| `parameters` | Object | ❌ | Paramètres de génération |
| `startedAt` | Date | ❌ | Date de début |
| `completedAt` | Date | ❌ | Date de fin |
| `errorMessage` | String | ❌ | Message d'erreur |
| `planData` | Object | ❌ | Plan intermédiaire |
| `results` | Object | ❌ | Résultats finaux |
| `aiApiCalls` | Array | ❌ | Log des appels IA |
| `notifications` | Object | ❌ | État des notifications |

**Statuts possibles :**
- `pending`: En attente
- `planning`: Planification
- `detailing`: Détaillage
- `creating`: Création
- `completed`: Terminé
- `failed`: Échec

---

### ChatbotJob
**Fichier :** `server/models/ChatbotJob.js`

Modèle gérant les jobs de traitement des requêtes chatbot.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `conversationId` | String | ✅ | ID de conversation |
| `userQuery` | String | ✅ | Requête utilisateur |
| `intent` | String | ✅ | Intention détectée |
| `entities` | Mixed | ❌ | Entités extraites |
| `status` | String | ❌ | Statut du job |
| `progress` | Object | ❌ | Progression détaillée |
| `result` | Object | ❌ | Résultat du traitement |
| `aiModel` | String | ❌ | Modèle IA utilisé |
| `tokensUsed` | Number | ❌ | Tokens consommés |
| `executionTime` | Number | ❌ | Temps d'exécution (ms) |

**Intentions supportées :**
- `add_step`: Ajouter une étape
- `delete_step`: Supprimer une étape
- `add_accommodation`: Ajouter un hébergement
- `add_activity`: Ajouter une activité
- Etc.

---

### StepSyncJob
**Fichier :** `server/models/StepSyncJob.js`

Modèle gérant la synchronisation des dates entre étapes.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `status` | String | ❌ | Statut ('pending', 'running', 'completed', 'failed') |
| `progress` | Object | ❌ | Progression du traitement |
| `startedAt` | Date | ❌ | Date de début |
| `completedAt` | Date | ❌ | Date de fin |
| `errorMessage` | String | ❌ | Message d'erreur |
| `results` | Object | ❌ | Résultats détaillés |

**Résultats inclus :**
- Nombre d'étapes traitées et synchronisées
- Détails des changements par étape
- Rapport de cohérence temporelle

---

### TravelTimeJob
**Fichier :** `server/models/TravelTimeJob.js`

Modèle gérant le calcul des temps de trajet entre étapes.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `status` | String | ❌ | Statut du job |
| `progress` | Object | ❌ | Progression du calcul |
| `startedAt` | Date | ❌ | Date de début |
| `completedAt` | Date | ❌ | Date de fin |
| `errorMessage` | String | ❌ | Message d'erreur |
| `results` | Object | ❌ | Résultats du calcul |

**Résultats inclus :**
- Distance totale du roadtrip
- Temps de trajet total
- Nombre d'étapes avec incohérences temporelles

---

### TaskGenerationJob
**Fichier :** `server/models/TaskGenerationJob.js`

Modèle gérant la génération automatique de tâches.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `status` | String | ❌ | Statut ('pending', 'processing', 'completed', 'failed') |
| `result` | Object | ❌ | Résultat de génération |
| `options` | Object | ❌ | Options de génération |
| `createdAt` | Date | ❌ | Date de création |
| `completedAt` | Date | ❌ | Date de completion |

---

### StepStoryJob
**Fichier :** `server/models/StepStoryJob.js`

Modèle gérant la génération de récits pour les étapes.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `stepId` | ObjectId | ✅ | Référence vers l'étape |
| `status` | String | ❌ | Statut ('pending', 'processing', 'done', 'error') |
| `result` | Mixed | ❌ | Résultat de génération |
| `error` | String | ❌ | Message d'erreur |
| `createdAt` | Date | ❌ | Date de création |
| `updatedAt` | Date | ❌ | Date de mise à jour |

---

### AITaskJob
**Fichier :** `server/models/AITaskJob.js`

Modèle gérant la génération de tâches par IA.

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `userId` | ObjectId | ✅ | Référence vers l'utilisateur |
| `roadtripId` | ObjectId | ✅ | Référence vers le roadtrip |
| `status` | String | ❌ | Statut du job |
| `progress` | Number | ❌ | Progression (0-100) |
| `currentStep` | String | ❌ | Étape actuelle |
| `result` | Object | ❌ | Résultats |
| `error` | Object | ❌ | Informations d'erreur |
| `parameters` | Object | ❌ | Paramètres de génération |
| `startedAt` | Date | ❌ | Date de début |
| `completedAt` | Date | ❌ | Date de fin |
| `estimatedDuration` | Number | ❌ | Durée estimée (secondes) |

**Méthodes :**
- `updateProgress(progress, currentStep)`: Mettre à jour la progression
- `markCompleted(tasks)`: Marquer comme terminé
- `markFailed(error)`: Marquer comme échoué

---

## Modèles Dépréciés

### Stage (Déprécié)
**Fichier :** `server/models/Stage.js`

⚠️ **Déprécié** - Remplacé par le modèle `Step` unifié.

Ancien modèle représentant une étape longue avec hébergements et activités.

### Stop (Déprécié)
**Fichier :** `server/models/Stop.js`

⚠️ **Déprécié** - Remplacé par le modèle `Step` unifié.

Ancien modèle représentant un arrêt court sans hébergement.

---

## Relations entre Modèles

```
User
├── Roadtrip (1:n)
│   ├── Step (1:n)
│   │   ├── Activity (1:n)
│   │   ├── Accommodation (1:n)
│   │   └── File (1:n)
│   ├── RoadtripTask (1:n)
│   └── File (1:n)
├── ChatHistory (1:n)
├── Notification (1:n)
└── UserSetting (1:1)

Jobs (Traitement Asynchrone)
├── AIRoadtripJob
├── ChatbotJob
├── StepSyncJob
├── TravelTimeJob
├── TaskGenerationJob
├── StepStoryJob
└── AITaskJob
```

## Index et Performances

La plupart des modèles incluent des index MongoDB pour optimiser les performances :

- **User** : `email`, `username`
- **Roadtrip** : `userId`
- **Step** : `userId`, `roadtripId`
- **Activity/Accommodation** : `userId`, `stepId`
- **ChatHistory** : `roadtripId + userId`, `conversationId`
- **Notification** : `userId + createdAt`, `roadtripId + userId`
- **Jobs** : `userId + roadtripId`, `status`, `createdAt`

## Conventions de Nommage

- **Collections** : Nom du modèle au singulier (MongoDB pluralise automatiquement)
- **Champs ObjectId** : Suffixe `Id` (ex: `userId`, `roadtripId`)
- **Champs booléens** : Préfixe `is` ou `has` (ex: `isActive`, `hasPhotos`)
- **Champs de date** : Suffixe `At` ou `DateTime` (ex: `createdAt`, `startDateTime`)
- **Énumérations** : Valeurs en snake_case pour les statuts, camelCase pour les autres

## Validation et Contraintes

- **Validation Mongoose** : Contraintes de type, requis, énumérations
- **Validation métier** : Contraintes cross-champs (ex: activités seulement pour Stage)
- **Index d'unicité** : `email`, `username`, `userId` pour UserSetting
- **TTL** : Expiration automatique des notifications après 7 jours

Cette documentation sera mise à jour au fur et à mesure de l'évolution de l'application.
```

## 📊 Mapping Critique API → WatermelonDB

| **API MongoDB** | **WatermelonDB Local** | **Conversion** |
|-----------------|------------------------|----------------|
| `arrivalDateTime` (ISO string) | `arrival_date_time` (number) | `new Date(api).getTime()` |
| `departureDateTime` (ISO string) | `departure_date_time` (number) | `new Date(api).getTime()` |
| `travelTimePreviousStep` (number) | `travel_time_previous_step` (number) | Direct |
| `distancePreviousStep` (number) | `distance_previous_step` (number) | Direct |
| `travelTimeNote` (string) | `travel_time_note` (string) | Direct |
| `activities` (Array<ObjectId>) | `activities` (JSON string) | `JSON.stringify(activities)` |
| `accommodations` (Array<ObjectId>) | `accommodations` (JSON string) | `JSON.stringify(accommodations)` |
| `thumbnail` (File Object) | `thumbnail` (JSON string) | `JSON.stringify(thumbnailObject)` |
| `photos` (Array<ObjectId>) | `photos` (JSON string) | `JSON.stringify(photos)` |
| `documents` (Array<ObjectId>) | `documents` (JSON string) | `JSON.stringify(documents)` |

## 🔄 Relations et Structures Complexes

### **API Response - Step avec données jointes**
```typescript
// Quand l'API retourne un Step avec populate()
{
  _id: "673abc123...",
  type: "Stage",
  name: "Étape 1",
  // ... autres champs step
  
  // Relations populées (objets complets, pas ObjectIds)
  thumbnail: {
    _id: "673def456...",
    fileId: "uuid-123",
    url: "https://storage.../thumb.jpg",
    type: "thumbnail"
  },
  
  activities: [
    {
      _id: "673ghi789...",
      type: "hiking",
      name: "Randonnée Mont Blanc",
      // ... autres champs activity
    }
  ],
  
  accommodations: [
    {
      _id: "673jkl012...",
      name: "Hôtel du Lac",
      // ... autres champs accommodation
    }
  ]
}
```

### **Stockage WatermelonDB correspondant**
```typescript
// Dans la table steps
{
  id: "673abc123...",
  type: "Stage",
  name: "Étape 1",
  // ... autres champs convertis
  
  // Relations sérialisées en JSON
  thumbnail: '{"_id":"673def456...","url":"https://...","type":"thumbnail"}',
  activities: '[{"_id":"673ghi789...","type":"hiking","name":"Randonnée Mont Blanc"}]',
  accommodations: '[{"_id":"673jkl012...","name":"Hôtel du Lac"}]'
}
```

## ⚠️ Validations Métier Critiques

### Step Type Rules
- **Stage** = peut avoir `accommodations` + `activities`
- **Stop** = JAMAIS d'`accommodations`/`activities`

### Thumbnail Structure (toujours objet complet)
```typescript
{
  _id: "673abc123...",
  fileId: "uuid-string", 
  url: "https://storage.../image.jpg",
  type: "thumbnail",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🚨 Erreurs Communes à Éviter

1. **Types API vs Local** : `Stage/Stop` (API) ≠ `StepType` (local)
2. **Dates** : API renvoie ISO strings, pas timestamps
3. **Thumbnails** : Objets complets, pas strings d'URL
4. **Arrays** : Sérialisation JSON obligatoire en WatermelonDB
5. **Relations** : ObjectIds en MongoDB, pas d'objets imbriqués

## 🔧 Patterns WatermelonDB Obligatoires

### Création avec closure fix
```typescript
await database.write(async () => {
  // Préparer TOUTES les données AVANT la closure
  const rawData = {
    name: apiStep.name,
    type: apiStep.type,
    thumbnail: JSON.stringify(apiStep.thumbnail),
    activities: JSON.stringify(apiStep.activities || [])
  };
  
  await stepsCollection.create((step: StepModel) => {
    step._setRaw('name', rawData.name);
    step._setRaw('type', rawData.type);
    step._setRaw('thumbnail', rawData.thumbnail);
    step._setRaw('activities', rawData.activities);
  });
});
```

### Désérialisation sécurisée
```typescript
// Dans toInterface()
get activities() {
  try {
    return JSON.parse(this.activitiesJson || '[]');
  } catch {
    return [];
  }
}
```

---
📖 **Documentation complète** : `Refonte/DOCUMENTATION_MODELES.md`
