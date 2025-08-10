import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { FileSize } from '@modules/photo/domain/value-objects/file-size.value-object';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { S3Status } from '@modules/photo/domain/photo.types';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';

export interface FileProps {
  path: FilePath;
  size: FileSize;
  dimensions: ImageDimensions;
  imageSize: ImageSize;
  s3Status?: S3Status;
  mimeType: MimeType;
}

export enum ImageSize {
  THUMBNAIL = 'THUMBNAIL',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ORIGINAL = 'ORIGINAL',
}

export enum SupportedImageMimeTypes {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  AVIF = 'image/avif',
  TIFF = 'image/tiff',
}
