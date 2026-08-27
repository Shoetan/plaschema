export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export type StoredObject = {
  objectKey: string;
  contentType: string;
  size: number;
};

export type PutObjectInput = {
  /** Logical folder prefix, e.g. enrollments/passports */
  prefix: string;
  originalFilename: string;
  buffer: Buffer;
  contentType: string;
};

export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StoredObject>;
  exists(objectKey: string): Promise<boolean>;
  get(
    objectKey: string,
  ): Promise<{ buffer: Buffer; contentType: string; size: number } | null>;
}
