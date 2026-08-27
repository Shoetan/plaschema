import { Module } from '@nestjs/common';
import { IdentityModule } from '../modules/identity/identity.module';
import { EnrollmentModule } from '../modules/enrollment/enrollment.module';
import { HealthFacilityModule } from '../modules/health-facility/health-facility.module';
import { WardModule } from '../modules/ward/ward.module';
import { AuthModule } from '../platform/auth/auth.module';
import { CacheModule } from '../platform/cache/cache.module';
import { AppConfigModule } from '../platform/config/app-config.module';
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
    AuthModule,
    HealthModule,
    IdentityModule,
    WardModule,
    HealthFacilityModule,
    EnrollmentModule,
  ],
})
export class AppModule {}
