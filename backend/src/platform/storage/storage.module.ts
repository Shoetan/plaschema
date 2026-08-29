import { Global, Module } from '@nestjs/common';
import { OBJECT_STORAGE } from './object-storage';
import { RailwayObjectStorage } from './railway-object-storage';

@Global()
@Module({
  providers: [
    RailwayObjectStorage,
    {
      provide: OBJECT_STORAGE,
      useExisting: RailwayObjectStorage,
    },
  ],
  exports: [OBJECT_STORAGE, RailwayObjectStorage],
})
export class StorageModule {}
