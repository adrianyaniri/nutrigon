import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { R2StorageProvider } from './r2.storage.provider.js';
import { MEDIA_STORAGE_PROVIDER } from './media.storage.interface.js';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: MEDIA_STORAGE_PROVIDER,
      useFactory: () => new R2StorageProvider(),
    },
  ],
  exports: [MediaService, MEDIA_STORAGE_PROVIDER],
})
export class MediaModule {}
