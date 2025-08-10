import { ImageSize } from '@modules/photo/domain/file.types';
import { ImageThumbnailDefinition } from '@modules/photo/interfaces/image-thumbnail-definition.interface';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { FileEntity } from '@modules/photo/domain/file.entity';

export interface ImageResizeParamsInterface {
  /**
   * Represents the path to a file in the filesystem to the original image
   * (can be a temporary file)
   */
  filePath: string;

  /**
   * Represents the logical image size
   */
  imageSize: ImageSize;

  /**
   * Represents the definition of an image thumbnail, such as width, height,
   * or the highest dimension
   */
  thumbnailDefinition: ImageThumbnailDefinition;

  originalImageDimensions: ImageDimensions;

  originalFile: FileEntity;
}
