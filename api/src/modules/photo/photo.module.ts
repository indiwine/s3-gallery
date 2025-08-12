import { Module, Provider } from '@nestjs/common';
import { PhotoMapper } from '@modules/photo/photo.mapper';
import { FileMapper } from '@modules/photo/file.mapper';
import { PhotoDao } from '@modules/photo/database/photo.dao';
import { ScanFilesystemService } from './commands/scan-filesystem/scan-filesystem.service';
import { SupportedFileFormatsService } from './domain/supported-file-formats.service';
import { ImageDeliveryStrategyService } from './domain/image-delivery-strategy.service';
import { CreatePhotoService } from './commands/create-photo/create-photo.service';
import { PHOTO_DAO } from '@modules/photo/photo.di-tikens';
import { ExifModule } from '@src/infrastructure/exif/exif.module';
import { ImageResizeModule } from '@src/infrastructure/image-resize/image-resize.module';
import { PrismaModule } from '@src/infrastructure/prisma/prisma.module';
import { StorageModule } from '@src/infrastructure/storage/storage.module';
import { ResizeImageService } from './commands/resize-image/resize-image.service';

const daoProviders: Provider[] = [
  {
    provide: PHOTO_DAO,
    useClass: PhotoDao,
  },
];

const mappers: Provider[] = [PhotoMapper, FileMapper];

const domainServices: Provider[] = [
  SupportedFileFormatsService,
  ImageDeliveryStrategyService,
];

const commands: Provider[] = [
  ScanFilesystemService,
  CreatePhotoService,
  ResizeImageService,
];

@Module({
  imports: [
    ExifModule,
    ImageResizeModule,
    PrismaModule,
    StorageModule.forRoot(),
  ],
  providers: [...mappers, ...daoProviders, ...domainServices, ...commands],
})
export class PhotoModule {}
