import { Injectable, OnModuleInit } from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { AppConfigService } from '../config/app-config.service';
import { AppError } from '../http/app-error';
import { createUuidV7 } from '../ids/uuid-v7';
import type {
  ObjectStorage,
  PutObjectInput,
  StoredObject,
} from './object-storage';

/**
 * Temporary local-disk stub. Replace with S3 (presigned read/write) later.
 */
@Injectable()
export class LocalObjectStorage implements ObjectStorage, OnModuleInit {
  constructor(private readonly config: AppConfigService) {}

  private get rootDir(): string {
    return path.resolve(this.config.localUploadDir);
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const extension = this.extensionFor(input.originalFilename, input.contentType);
    const objectKey = path.posix.join(
      input.prefix.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''),
      `${createUuidV7()}${extension}`,
    );
    const absolutePath = this.resolveSafePath(objectKey);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.buffer);

    return {
      objectKey,
      contentType: input.contentType,
      size: input.buffer.length,
    };
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      await fs.access(this.resolveSafePath(objectKey));
      return true;
    } catch {
      return false;
    }
  }

  async get(
    objectKey: string,
  ): Promise<{ buffer: Buffer; contentType: string; size: number } | null> {
    const absolutePath = this.resolveSafePath(objectKey);
    try {
      const buffer = await fs.readFile(absolutePath);
      return {
        buffer,
        contentType: this.guessContentType(objectKey),
        size: buffer.length,
      };
    } catch {
      return null;
    }
  }

  createReadStream(objectKey: string) {
    return createReadStream(this.resolveSafePath(objectKey));
  }

  private resolveSafePath(objectKey: string): string {
    const normalized = objectKey.replace(/\\/g, '/').replace(/^\/+/, '');
    if (
      !normalized ||
      normalized.includes('..') ||
      path.isAbsolute(normalized)
    ) {
      throw new AppError('VALIDATION_ERROR', 'Invalid object key', 400);
    }

    const absolutePath = path.resolve(this.rootDir, normalized);
    const rootWithSep = this.rootDir.endsWith(path.sep)
      ? this.rootDir
      : `${this.rootDir}${path.sep}`;

    if (absolutePath !== this.rootDir && !absolutePath.startsWith(rootWithSep)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid object key', 400);
    }

    return absolutePath;
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

  private guessContentType(objectKey: string): string {
    switch (path.extname(objectKey).toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}
