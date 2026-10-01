import { api, ApiError } from './api';
import type { Media } from '../types/api';

/** Uploads files one by one; returns the ones that succeeded and reports the others through onError. */
export async function uploadFiles(files: File[], onError: (message: string) => void): Promise<Media[]> {
  const uploaded: Media[] = [];
  for (const file of files) {
    try {
      uploaded.push(await api.media.upload(file));
    } catch (error) {
      onError(`${file.name}: ${error instanceof ApiError ? error.message : 'Tải lên thất bại.'}`);
    }
  }
  return uploaded;
}

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
