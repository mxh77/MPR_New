/**
 * Configuration et schéma de la base de données WatermelonDB
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1, // ✅ Retour temporaire à v6 pour reset
  tables: [
    // Table des roadtrips
    tableSchema({
      name: 'roadtrips',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number' },
        { name: 'start_location', type: 'string', isOptional: true },
        { name: 'end_location', type: 'string', isOptional: true },
        { name: 'currency', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string' },
        { name: 'is_public', type: 'boolean' },
        { name: 'thumbnail', type: 'string', isOptional: true },
        { name: 'total_steps', type: 'number' },
        { name: 'total_distance', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'photos', type: 'string' }, // JSON array
        { name: 'documents', type: 'string' }, // JSON array
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des étapes
    tableSchema({
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
        { name: 'activities', type: 'string', isOptional: true }, // ✅ Rétabli temporairement
        { name: 'accommodations', type: 'string', isOptional: true }, // ✅ Rétabli temporairement
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des activités
    tableSchema({
      name: 'activities',
      columns: [
        { name: 'step_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'start_time', type: 'number', isOptional: true },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'cost', type: 'number', isOptional: true },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true }, // JSON object
        { name: 'photos', type: 'string' }, // JSON array
        { name: 'url', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'algolia_trail_id', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des hébergements
    tableSchema({
      name: 'accommodations',
      columns: [
        { name: 'step_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'check_in', type: 'number' },
        { name: 'check_out', type: 'number' },
        { name: 'price_per_night', type: 'number', isOptional: true },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'location', type: 'string' }, // JSON object
        { name: 'photos', type: 'string' }, // JSON array
        { name: 'url', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'amenities', type: 'string' }, // JSON array
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des tâches
    tableSchema({
      name: 'roadtrip_tasks',
      columns: [
        { name: 'roadtrip_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'assigned_to', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des fichiers
    tableSchema({
      name: 'files',
      columns: [
        { name: 'roadtrip_id', type: 'string', isIndexed: true },
        { name: 'step_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'activity_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'filename', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'size', type: 'number' },
        { name: 'url', type: 'string' },
        { name: 'local_path', type: 'string', isOptional: true },
        { name: 'upload_status', type: 'string' },
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des récits/stories
    tableSchema({
      name: 'stories',
      columns: [
        { name: 'roadtrip_id', type: 'string', isIndexed: true },
        { name: 'step_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'photos', type: 'string' }, // JSON array
        { name: 'published_at', type: 'number', isOptional: true },
        { name: 'is_public', type: 'boolean' },
        { name: 'likes', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table des notifications
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'roadtrip_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'data', type: 'string', isOptional: true }, // JSON object
        { name: 'is_read', type: 'boolean' },
        { name: 'read_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Table de la queue de synchronisation
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'record_id', type: 'string', isIndexed: true },
        { name: 'operation', type: 'string' },
        { name: 'data', type: 'string', isOptional: true }, // JSON object
        { name: 'attempts', type: 'number' },
        { name: 'last_attempt_at', type: 'number', isOptional: true },
        { name: 'error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
