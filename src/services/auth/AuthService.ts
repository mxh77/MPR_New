/**
 * Service d'authentification avec JWT et stockage sécurisé
 */
import * as SecureStore from 'expo-secure-store';
import { ENV_CONFIG } from '../../config';
import type { AuthResult, RegisterData, User } from '../../types';
import { apiClient } from '../api';

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  /**
   * Connexion utilisateur
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { user, token, refreshToken } = response.data;

      // Stockage sécurisé
      await this.storeAuthData(user, token, refreshToken);

      return { user, token, refreshToken };
    } catch (error) {
      throw new Error('Échec de la connexion');
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/auth/register', userData);

      const { user, token, refreshToken } = response.data;

      // Stockage sécurisé
      await this.storeAuthData(user, token, refreshToken);

      return { user, token, refreshToken };
    } catch (error) {
      throw new Error('Échec de l\'inscription');
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Appel API pour invalider le token côté serveur
      const token = await this.getToken();
      if (token) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Continuer même si l'API échoue
      if (ENV_CONFIG.DEBUG) {
        console.warn('Logout API failed:', error);
      }
    } finally {
      // Nettoyage local
      await this.clearAuthData();
    }
  }

  /**
   * Actualisation du token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await SecureStore.getItemAsync(AuthService.REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken,
      });

      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      // Mise à jour du stockage
      await SecureStore.setItemAsync(AuthService.TOKEN_KEY, newToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync(AuthService.REFRESH_TOKEN_KEY, newRefreshToken);
      }

      return newToken;
    } catch (error) {
      // Token de rafraîchissement invalide, déconnexion nécessaire
      await this.clearAuthData();
      throw new Error('Session expirée');
    }
  }

  /**
   * Vérification de l'état d'authentification
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Récupération du token actuel
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AuthService.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Récupération des données utilisateur
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(AuthService.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Sauvegarder le token manuellement
   */
  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AuthService.TOKEN_KEY, token);
  }

  /**
   * Sauvegarder l'utilisateur manuellement
   */
  async saveUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(AuthService.USER_KEY, JSON.stringify(user));
  }

  /**
   * Stockage des données d'authentification
   */
  private async storeAuthData(user: User, token: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(AuthService.TOKEN_KEY, token),
      SecureStore.setItemAsync(AuthService.REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(AuthService.USER_KEY, JSON.stringify(user)),
    ]);
  }

  /**
   * Nettoyage des données d'authentification
   */
  private async clearAuthData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(AuthService.TOKEN_KEY),
      SecureStore.deleteItemAsync(AuthService.REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AuthService.USER_KEY),
    ]);
  }
}

export const authService = new AuthService();
export default authService;
