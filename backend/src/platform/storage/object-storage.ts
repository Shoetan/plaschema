export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export type PresignUploadInput = {
  /** Logical folder prefix, e.g. enrollments/passports */
  prefix: string;
  originalFilename: string;
  contentType: string;
};

export type PresignUploadResult = {
  objectKey: string;
  uploadUrl: string;
  contentType: string;
  expiresInSeconds: number;
};

export type PresignReadResult = {
  objectKey: string;
  readUrl: string;
  expiresInSeconds: number;
};

export interface ObjectStorage {
  createUploadUrl(input: PresignUploadInput): Promise<PresignUploadResult>;
  createReadUrl(objectKey: string): Promise<PresignReadResult>;
  exists(objectKey: string): Promise<boolean>;
}
