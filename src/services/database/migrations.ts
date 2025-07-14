/**
 * Migrations WatermelonDB
 */
import { schemaMigrations, addColumns, createTable, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration vers version 2
    {
      toVersion: 2,
      steps: [],
    },
    // Migration vers version 3
    {
      toVersion: 3,
      steps: [],
    },
    // Migration vers version 4
    {
      toVersion: 4,
      steps: [],
    },
    // Migration vers version 5 - schéma complet
    {
      toVersion: 5,
      steps: [],
    },
    // Migration vers version 6 - ajout activités et accommodations
    {
      toVersion: 6,
      steps: [],
    },
  ],
});
