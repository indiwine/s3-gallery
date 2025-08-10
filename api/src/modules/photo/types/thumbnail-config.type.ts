import { ImageSize } from '@modules/photo/domain/file.types';
import { ImageThumbnailDefinition } from '@modules/photo/interfaces/image-thumbnail-definition.interface';

export type ThumbnailConfigType = {
  [K in Exclude<ImageSize, ImageSize.ORIGINAL>]: ImageThumbnailDefinition;
};
