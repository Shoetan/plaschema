import { Module } from '@nestjs/common';
import { CacheModule } from '../platform/cache/cache.module';
import { AppConfigModule } from '../platform/config/app-config.module';
import { HealthModule } from '../platform/health/health.module';
import { ObservabilityModule } from '../platform/observability/observability.module';
import { PersistenceModule } from '../platform/persistence/persistence.module';

@Module({
  imports: [
    AppConfigModule,
    ObservabilityModule,
    PersistenceModule,
    CacheModule,
    HealthModule,
  ],
})
export class AppModule {}
