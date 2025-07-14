/**
 * Migrations WatermelonDB
 */
import { schemaMigrations, addColumns, createTable, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration de la version 1 vers 2 - Ajout des colonnes pour l'API
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'roadtrips',
          columns: [
            { name: 'start_location', type: 'string', isOptional: true },
            { name: 'end_location', type: 'string', isOptional: true },
            { name: 'currency', type: 'string', isOptional: true },
            { name: 'photos', type: 'string' }, // JSON array
            { name: 'documents', type: 'string' }, // JSON array
            { name: 'server_id', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    // Migration de la version 2 vers 3 - Restructure table steps pour correspondre au backend
    {
      toVersion: 3,
      steps: [
        // Supprimer complètement l'ancienne table steps et toutes ses données
        unsafeExecuteSql('DROP TABLE IF EXISTS steps;'),
        // Supprimer aussi les activités et accommodations liées pour éviter les conflits
        unsafeExecuteSql('DROP TABLE IF EXISTS activities;'),
        unsafeExecuteSql('DROP TABLE IF EXISTS accommodations;'),
        // Recréer la table steps avec la nouvelle structure
        createTable({
          name: 'steps',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'roadtrip_id', type: 'string', isIndexed: true },
            { name: 'type', type: 'string', isOptional: true },
            { name: 'name', type: 'string', isOptional: true },
            { name: 'address', type: 'string', isOptional: true },
            { name: 'latitude', type: 'number', isOptional: true },
            { name: 'longitude', type: 'number', isOptional: true },
            { name: 'arrival_date_time', type: 'number', isOptional: true },
            { name: 'departure_date_time', type: 'number', isOptional: true },
            { name: 'travel_time_previous_step', type: 'number', isOptional: true },
            { name: 'distance_previous_step', type: 'number', isOptional: true },
            { name: 'is_arrival_time_consistent', type: 'boolean', isOptional: true },
            { name: 'travel_time_note', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'thumbnail', type: 'string', isOptional: true },
            { name: 'story', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    // Migration de la version 3 vers 4 - Nettoyage complet et reset des tables
    {
      toVersion: 4,
      steps: [
        // Nettoyage complet de toutes les tables
        unsafeExecuteSql('DROP TABLE IF EXISTS steps;'),
        unsafeExecuteSql('DROP TABLE IF EXISTS activities;'),
        unsafeExecuteSql('DROP TABLE IF EXISTS accommodations;'),
        unsafeExecuteSql('DROP TABLE IF EXISTS files;'),
        unsafeExecuteSql('DROP TABLE IF EXISTS stories;'),
        // Recréer la table steps proprement
        createTable({
          name: 'steps',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'roadtrip_id', type: 'string', isIndexed: true },
            { name: 'type', type: 'string', isOptional: true },
            { name: 'name', type: 'string', isOptional: true },
            { name: 'address', type: 'string', isOptional: true },
            { name: 'latitude', type: 'number', isOptional: true },
            { name: 'longitude', type: 'number', isOptional: true },
            { name: 'arrival_date_time', type: 'number', isOptional: true },
            { name: 'departure_date_time', type: 'number', isOptional: true },
            { name: 'travel_time_previous_step', type: 'number', isOptional: true },
            { name: 'distance_previous_step', type: 'number', isOptional: true },
            { name: 'is_arrival_time_consistent', type: 'boolean', isOptional: true },
            { name: 'travel_time_note', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'thumbnail', type: 'string', isOptional: true },
            { name: 'story', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
