import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: AppConfigService) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }

    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    const { status } = this.client;

    if (status === 'end' || status === 'close') {
      return;
    }

    try {
      if (status === 'ready') {
        await this.client.quit();
        return;
      }

      this.client.disconnect();
    } catch {
      this.client.disconnect();
    }
  }
}
