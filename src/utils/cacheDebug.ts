/**
 * Utilitaires de debug pour analyser le comportement du cache
 * Permet de diagnostiquer les problèmes de cache bypass en production
 */

export interface CacheDebugInfo {
  totalItems: number;
  userItems: number;
  environment: 'development' | 'production';
  timestamp: string;
  buildInfo: {
    isDev: boolean;
    isExpo: boolean;
    platform: string;
  };
}

/**
 * Log détaillé de l'état du cache pour debug
 */
export const logCacheState = (
  currentCount: number,
  roadtripsStateLength: number,
  userId: string,
  context: string = 'Unknown'
): void => {
  const debugInfo = {
    context,
    timestamp: new Date().toISOString(),
    cache: {
      dbCount: currentCount,
      stateLength: roadtripsStateLength,
      userId: userId?.substring(0, 8) + '...',
      userIdLength: userId?.length
    },
    environment: {
      isDev: __DEV__,
      nodeEnv: process.env.NODE_ENV,
      platform: require('react-native').Platform.OS
    }
  };

  console.log(`🔍 CACHE DEBUG [${context}]:`, JSON.stringify(debugInfo, null, 2));
};

/**
 * Vérifier si le cache doit être utilisé ou si une sync est nécessaire
 */
export const shouldUseCache = (
  currentCount: number,
  forceSync: boolean,
  isOnline: boolean,
  context: string = 'Unknown'
): { useCache: boolean; reason: string } => {
  const result = {
    useCache: currentCount > 0 && !forceSync,
    reason: ''
  };

  if (!isOnline) {
    result.useCache = true;
    result.reason = 'Offline - utilisation forcée du cache';
  } else if (forceSync) {
    result.useCache = false;
    result.reason = 'ForceSync activé';
  } else if (currentCount === 0) {
    result.useCache = false;
    result.reason = 'Cache vide - sync nécessaire';
  } else {
    result.useCache = true;
    result.reason = `Cache disponible (${currentCount} items)`;
  }

  console.log(`🎯 CACHE DECISION [${context}]:`, {
    useCache: result.useCache,
    reason: result.reason,
    factors: { currentCount, forceSync, isOnline }
  });

  return result;
};

/**
 * Debug spécifique pour les problèmes de production
 */
export const debugProductionCache = (
  currentCount: number,
  roadtripsLength: number,
  isOnline: boolean,
  syncing: boolean
): void => {
  const productionIssues = [];

  // Détection des problèmes courants en production
  if (currentCount > 0 && roadtripsLength === 0) {
    productionIssues.push('⚠️ Cache DB présent mais state React vide');
  }

  if (currentCount === 0 && !__DEV__) {
    productionIssues.push('⚠️ Cache vide en production - première installation?');
  }

  if (isOnline && syncing && currentCount > 0) {
    productionIssues.push('⚠️ Sync en cours malgré cache disponible');
  }

  if (!__DEV__ && isOnline) {
    productionIssues.push('ℹ️ Mode production avec connexion - sync possible');
  }

  if (productionIssues.length > 0) {
    console.log('🚨 PRODUCTION CACHE ANALYSIS:');
    productionIssues.forEach(issue => console.log(`   ${issue}`));
  }

  console.log('📊 PRODUCTION CACHE METRICS:', {
    environment: __DEV__ ? 'development' : 'production',
    cacheHealth: currentCount > 0 ? 'OK' : 'EMPTY',
    stateSync: roadtripsLength === currentCount ? 'SYNC' : 'DESYNC',
    networkStatus: isOnline ? 'ONLINE' : 'OFFLINE',
    syncStatus: syncing ? 'SYNCING' : 'IDLE'
  });
};
