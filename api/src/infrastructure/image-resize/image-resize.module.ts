import { Module } from '@nestjs/common';
import { AvifImageResizeAdapter } from './avif-image-resize.adapter';
import { IMAGE_RESIZE_ADAPTER } from '@src/infrastructure/image-resize/image-resize.di-tokens';

@Module({
  providers: [
    {
      provide: IMAGE_RESIZE_ADAPTER,
      useClass: AvifImageResizeAdapter,
    },
  ],
  exports: [IMAGE_RESIZE_ADAPTER],
})
export class ImageResizeModule {}
