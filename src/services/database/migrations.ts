/**
 * Migrations WatermelonDB
 */
import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});
