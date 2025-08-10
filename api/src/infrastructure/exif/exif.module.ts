import { Module } from '@nestjs/common';
import { ExifReaderAdapter } from './exif-reader.adapter';
import { EXIF_SERVICE } from '@src/infrastructure/exif/exif.di-tokens';

@Module({
  providers: [
    {
      provide: EXIF_SERVICE,
      useClass: ExifReaderAdapter,
    },
  ],
  exports: [EXIF_SERVICE],
})
export class ExifModule {}
