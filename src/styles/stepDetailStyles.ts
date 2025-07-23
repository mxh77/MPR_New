/**
 * Styles communs pour les écrans de détail d'étape
 * Styles réutilisables entre les différents onglets
 */
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const stepDetailStyles = StyleSheet.create({
  // Contenu des onglets
  tabContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Carte d'informations principale
  infoCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Cartes d'éléments (activités/hébergements)
  itemCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Titre principal
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Container pour thumbnail
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 16,
  },

  // Thumbnail styles
  stepThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  stepThumbnailPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },

  // Boutons menu sur thumbnail
  thumbnailMenuButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailMenuButtonPlaceholder: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Boutons de suppression (trash) - positionnés en bas à droite avec couleur rouge
  thumbnailDeleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.9)', // Rouge avec transparence
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailDeleteButtonPlaceholder: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.7)', // Rouge avec plus de transparence pour placeholder
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Styles pour placeholder
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Ligne d'adresse
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  // Lignes de dates
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    minWidth: 60,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  // Section description
  descriptionSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Type d'élément
  itemType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  itemAddress: {
    fontSize: 14,
    marginBottom: 12,
  },

  // Boutons d'action
  activityActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  activityActionIcon: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },

  // État vide
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
