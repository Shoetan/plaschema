import {
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import path from 'node:path';
import { AppConfigService } from '../config/app-config.service';
import { AppError } from '../http/app-error';
import { createUuidV7 } from '../ids/uuid-v7';
import type {
  ObjectStorage,
  PresignReadResult,
  PresignUploadInput,
  PresignUploadResult,
} from './object-storage';

/**
 * Railway Buckets (S3-compatible / Tigris) with presigned upload + read URLs.
 */
@Injectable()
export class RailwayObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly config: AppConfigService) {
    this.client = new S3Client({
      region: this.config.objectStorageRegion,
      endpoint: this.config.objectStorageEndpoint,
      credentials: {
        accessKeyId: this.config.objectStorageAccessKeyId,
        secretAccessKey: this.config.objectStorageSecretAccessKey,
      },
    });
  }

  async createUploadUrl(
    input: PresignUploadInput,
  ): Promise<PresignUploadResult> {
    const extension = this.extensionFor(
      input.originalFilename,
      input.contentType,
    );
    const objectKey = path.posix.join(
      this.normalizePrefix(input.prefix),
      `${createUuidV7()}${extension}`,
    );
    this.assertSafeObjectKey(objectKey);

    const expiresInSeconds = this.config.objectStoragePresignTtlSeconds;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.objectStorageBucketName,
        Key: objectKey,
        ContentType: input.contentType,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      objectKey,
      uploadUrl,
      contentType: input.contentType,
      expiresInSeconds,
    };
  }

  async createReadUrl(objectKey: string): Promise<PresignReadResult> {
    const key = this.assertSafeObjectKey(objectKey);
    const expiresInSeconds = this.config.objectStoragePresignTtlSeconds;

    const readUrl = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.objectStorageBucketName,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      objectKey: key,
      readUrl,
      expiresInSeconds,
    };
  }

  async exists(objectKey: string): Promise<boolean> {
    const key = this.assertSafeObjectKey(objectKey);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.objectStorageBucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error: unknown) {
      if (this.isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }

  async putObject(input: {
    objectKey: string;
    body: Buffer;
    contentType: string;
  }): Promise<void> {
    const key = this.assertSafeObjectKey(input.objectKey);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.objectStorageBucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async getObject(objectKey: string): Promise<{
    body: Buffer;
    contentType?: string;
  }> {
    const key = this.assertSafeObjectKey(objectKey);
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.objectStorageBucketName,
          Key: key,
        }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        throw new AppError('OBJECT_NOT_FOUND', 'Object has no body', 404);
      }
      return {
        body: Buffer.from(bytes),
        contentType: result.ContentType,
      };
    } catch (error: unknown) {
      if (this.isNotFound(error)) {
        throw new AppError('OBJECT_NOT_FOUND', 'Object not found', 404);
      }
      throw error;
    }
  }

  private normalizePrefix(prefix: string): string {
    return prefix.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  }

  private assertSafeObjectKey(objectKey: string): string {
    const normalized = decodeURIComponent(objectKey)
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

    if (
      !normalized ||
      normalized.includes('..') ||
      path.isAbsolute(normalized) ||
      normalized.includes('\0')
    ) {
      throw new AppError('VALIDATION_ERROR', 'Invalid object key', 400);
    }

    return normalized;
  }

  private extensionFor(filename: string, contentType: string): string {
    const fromName = path.extname(filename).toLowerCase();
    if (fromName && fromName.length <= 8) {
      return fromName;
    }

    switch (contentType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'application/pdf':
        return '.pdf';
      default:
        return '';
    }
  }

  private isNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const name = 'name' in error ? String(error.name) : '';
    const statusCode =
      '$metadata' in error &&
      error.$metadata &&
      typeof error.$metadata === 'object' &&
      'httpStatusCode' in error.$metadata
        ? Number(error.$metadata.httpStatusCode)
        : undefined;

    return (
      name === 'NotFound' ||
      name === 'NoSuchKey' ||
      name === 'NotFoundError' ||
      statusCode === 404
    );
  }
}
