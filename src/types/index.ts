/**
 * Types de base pour l'application Mon Petit Roadtrip
 */

// Types d'activités
export type ActivityType = 'hiking' | 'visit' | 'restaurant' | 'accommodation' | 'transport' | 'other';

// Types d'étapes  
export type StepType = 'Stage' | 'Stop';

// Priorités des tâches
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Statuts des tâches
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Types de notifications
export type NotificationType = 'chatbot_success' | 'chatbot_error' | 'system' | 'reminder' | 'sync_error';

// Entité de base avec tracking
export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  lastSyncAt?: Date;
}

// Utilisateur
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
}

// Préférences utilisateur
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  notifications: boolean;
  geolocation: boolean;
  offlineMode: boolean;
}

// Roadtrip
export interface Roadtrip extends BaseEntity {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startLocation?: string;
  endLocation?: string;
  currency?: string;
  userId: string;
  isPublic: boolean;
  thumbnail?: string;
  totalSteps: number;
  totalDistance?: number;
  estimatedDuration?: number;
  tags: string[];
  photos?: string[];
  documents?: string[];
  serverId?: string; // Pour liaison avec l'API
}

// Étape
export interface Step extends BaseEntity {
  roadtripId: string;
  title: string;
  description?: string;
  type: StepType;
  orderIndex: number;
  location: Location;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  distance?: number;
  thumbnail?: string;
}

// Localisation
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

// Information de transport
export interface TransportInfo {
  type: 'car' | 'train' | 'plane' | 'bus' | 'walk' | 'bike';
  duration?: number;
  distance?: number;
  cost?: number;
  notes?: string;
}

// Activité
export interface Activity extends BaseEntity {
  stepId: string;
  title: string;
  description?: string;
  type: ActivityType;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  cost?: number;
  rating?: number;
  notes?: string;
  location?: Location;
  photos: string[];
  url?: string;
  phone?: string;
  algoliaTrailId?: string;
}

// Hébergement
export interface Accommodation extends BaseEntity {
  stepId: string;
  name: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'camping' | 'other';
  checkIn: Date;
  checkOut: Date;
  pricePerNight?: number;
  rating?: number;
  location: Location;
  photos: string[];
  url?: string;
  phone?: string;
  notes?: string;
  amenities: string[];
}

// Tâche
export interface RoadtripTask extends BaseEntity {
  roadtripId: string;
  title: string;
  description?: string;
  category: 'preparation' | 'booking' | 'packing' | 'other';
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string;
}

// Fichier
export interface File extends BaseEntity {
  roadtripId: string;
  stepId?: string;
  activityId?: string;
  filename: string;
  type: 'image' | 'document' | 'audio' | 'video';
  size: number;
  url: string;
  localPath?: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
}

// Récit/Story
export interface Story extends BaseEntity {
  roadtripId: string;
  stepId?: string;
  title: string;
  content: string;
  photos: string[];
  publishedAt?: Date;
  isPublic: boolean;
  likes: number;
  comments: Comment[];
}

// Commentaire
export interface Comment extends BaseEntity {
  storyId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  likes: number;
}

// Notification
export interface Notification extends BaseEntity {
  roadtripId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
}

// Queue de synchronisation
export interface SyncQueue extends BaseEntity {
  tableName: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data?: Record<string, any>;
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
}

// Message de chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isOffline?: boolean;
  roadtripId: string;
}

// Résultat d'authentification
export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

// Données d'inscription
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

// Résultat de synchronisation
export interface SyncResult {
  success: boolean;
  syncedRecords: number;
  failedRecords: number;
  errors: string[];
  lastSyncAt: Date;
}

// Statut de synchronisation
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date;
  pendingItems: number;
  failedItems: number;
}

// Trail Algolia
export interface AlgoliaTrail {
  objectID: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  distance: number;
  elevation: number;
  location: Location;
  photos: string[];
  rating: number;
  reviewCount: number;
}

// Navigation params
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  RoadTrips: undefined;
  RoadTrip: { roadtripId: string };
  Step: { stepId: string; roadtripId: string };
  CreateRoadtrip: { mode: 'classic' | 'ai' };
  EditStep: { stepId: string; returnTo?: string; returnToTab?: string };
  EditActivity: { activityId: string; returnTo?: string; returnToTab?: string };
  EditAccommodation: { accommodationId: string; returnTo?: string; returnToTab?: string };
  CreateStep: { roadtripId: string };
  TaskDetail: { taskId: string };
  TaskEdit: { taskId?: string; roadtripId: string };
  Settings: undefined;
  Notifications: { roadtripId: string };
  HikeSuggestions: { stepId: string };
};

export type RoadTripTabParamList = {
  StepList: { roadtripId: string };
  Tasks: { roadtripId: string };
  Planning: { roadtripId: string };
};

export type StepTabParamList = {
  StepInfo: { stepId: string };
  Accommodations: { stepId: string };
  Activities: { stepId: string };
  Planning?: { stepId: string };
};
