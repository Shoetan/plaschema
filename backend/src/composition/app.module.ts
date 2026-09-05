import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IdentityModule } from '../modules/identity/identity.module';
import { ActivityLogModule } from '../modules/activity-log/activity-log.module';
import { EnrollmentModule } from '../modules/enrollment/enrollment.module';
import { HealthFacilityModule } from '../modules/health-facility/health-facility.module';
import { CapitationModule } from '../modules/capitation/capitation.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { FileJobModule } from '../modules/file-job/file-job.module';
import { WardModule } from '../modules/ward/ward.module';
import { AuthModule } from '../platform/auth/auth.module';
import { CacheModule } from '../platform/cache/cache.module';
import { AppConfigModule } from '../platform/config/app-config.module';
import { AppConfigService } from '../platform/config/app-config.service';
import { HealthModule } from '../platform/health/health.module';
import { ObservabilityModule } from '../platform/observability/observability.module';
import { PersistenceModule } from '../platform/persistence/persistence.module';
import { StorageModule } from '../platform/storage/storage.module';

@Module({
  imports: [
    AppConfigModule,
    ObservabilityModule,
    PersistenceModule,
    CacheModule,
    StorageModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: { url: config.redisUrl },
      }),
    }),
    AuthModule,
    HealthModule,
    ActivityLogModule,
    IdentityModule,
    WardModule,
    HealthFacilityModule,
    CapitationModule,
    EnrollmentModule,
    FileJobModule,
    DashboardModule,
  ],
})
export class AppModule {}
