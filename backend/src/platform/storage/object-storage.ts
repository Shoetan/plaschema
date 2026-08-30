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

export type PresignReadOptions = {
  /** Suggested filename for browser downloads (sets Content-Disposition on the presigned GET). */
  downloadFilename?: string;
};

export type PresignReadResult = {
  objectKey: string;
  readUrl: string;
  expiresInSeconds: number;
  downloadFilename?: string;
};

export type PutObjectInput = {
  objectKey: string;
  body: Buffer;
  contentType: string;
};

export type GetObjectResult = {
  body: Buffer;
  contentType?: string;
};

export interface ObjectStorage {
  createUploadUrl(input: PresignUploadInput): Promise<PresignUploadResult>;
  createReadUrl(
    objectKey: string,
    options?: PresignReadOptions,
  ): Promise<PresignReadResult>;
  exists(objectKey: string): Promise<boolean>;
  putObject(input: PutObjectInput): Promise<void>;
  getObject(objectKey: string): Promise<GetObjectResult>;
}
