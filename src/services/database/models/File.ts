/**
 * Modèle File pour WatermelonDB
 */
import { field } from '@nozbe/watermelondb/decorators';
import BaseModel from './BaseModel';
import type { File as IFile } from '../../../types';

export default class File extends BaseModel {
  static table = 'files';

  @field('roadtrip_id') roadtripId!: string;
  @field('step_id') stepId?: string;
  @field('activity_id') activityId?: string;
  @field('filename') filename!: string;
  @field('type') type!: string;
  @field('size') size!: number;
  @field('url') url!: string;
  @field('local_path') localPath?: string;
  @field('upload_status') uploadStatus!: string;

  toInterface(): IFile {
    return {
      _id: this.id,
      roadtripId: this.roadtripId,
      stepId: this.stepId,
      activityId: this.activityId,
      filename: this.filename,
      type: this.type as any,
      size: this.size,
      url: this.url,
      localPath: this.localPath,
      uploadStatus: this.uploadStatus as any,
      syncStatus: this.customSyncStatus as any,
      lastSyncAt: this.lastSyncAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
