import { ExifData } from '@modules/photo/domain/value-objects/exif-data.value-object';

export interface ExifReaderPort {
  readExifData(filePath: string): Promise<ExifData | null>;
}
