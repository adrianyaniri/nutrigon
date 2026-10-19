export const MEDIA_STORAGE_PROVIDER = Symbol('MEDIA_STORAGE_PROVIDER');

export interface PresignPutParams {
  key: string;
  contentType: string;
  expiresInSeconds: number;
  contentLength?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
}

export interface IMediaStorageProvider {
  createPresignedPutUrl(params: PresignPutParams): Promise<PresignedUploadResult>;
}
