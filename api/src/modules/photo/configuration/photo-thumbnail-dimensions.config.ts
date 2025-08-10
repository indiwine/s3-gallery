import { registerAs } from '@nestjs/config';
import { ThumbnailConfigType } from '@modules/photo/types/thumbnail-config.type';
import { ImageSize } from '@modules/photo/domain/file.types';

export default registerAs(
  'photo.thumbnail-dimensions',
  (): ThumbnailConfigType => ({
    [ImageSize.THUMBNAIL]: {
      width: 200,
      height: 200,
    },
    [ImageSize.SMALL]: {
      width: 400,
      height: 400,
    },
    [ImageSize.MEDIUM]: {
      highest: 800,
    },
    [ImageSize.LARGE]: {
      highest: 1200,
    },
  }),
);
