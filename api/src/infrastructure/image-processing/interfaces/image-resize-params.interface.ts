import { FileEntity } from '@modules/photo/domain/file.entity';
import { ImageSize } from '@modules/photo/domain/file.types';
import { ImageThumbnailDefinition } from '@modules/photo/interfaces/image-thumbnail-definition.interface';

export interface ImageResizeParamsInterface {
  originalFile: FileEntity;
  originalFilePath: string;
  imageSize: ImageSize;
  thumbnailDefinition: ImageThumbnailDefinition;
}
