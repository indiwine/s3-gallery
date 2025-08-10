import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { ExifData } from '@modules/photo/domain/value-objects/exif-data.value-object';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';

export interface PhotoProps {
  name: string;
  path: FilePath;
  dimensions: ImageDimensions;
  mimeType: MimeType;
  exif?: ExifData;
  s3Status?: S3Status;
}

export enum S3Status {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED',
}
