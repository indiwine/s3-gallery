import { Module } from '@nestjs/common';
import { AvifImageResizeAdapter } from '@src/infrastructure/image-processing/avif-image-resize.adapter';
import { SharpImageInfoAdapter } from './sharp-image-info.adapter';
import {
  IMAGE_INFO_ADAPTER,
  IMAGE_RESIZE_ADAPTER,
} from './image-processing.di-tokens';

@Module({
  providers: [
    {
      provide: IMAGE_RESIZE_ADAPTER,
      useClass: AvifImageResizeAdapter,
    },
    {
      provide: IMAGE_INFO_ADAPTER,
      useClass: SharpImageInfoAdapter,
    },
  ],
  exports: [IMAGE_RESIZE_ADAPTER, IMAGE_INFO_ADAPTER],
})
export class ImageProcessingModule {}
