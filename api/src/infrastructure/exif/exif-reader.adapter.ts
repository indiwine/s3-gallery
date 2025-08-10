import { Injectable, Logger } from '@nestjs/common';
import * as exifr from 'exifr';
import { ExifReaderPort } from '@src/infrastructure/ports/exif-reader.port';
import { ExifData } from '@modules/photo/domain/value-objects/exif-data.value-object';

interface ExifResult {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: Date | string;
  FocalLength?: number;
  FNumber?: number;
  ISO?: number;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class ExifReaderAdapter implements ExifReaderPort {
  private readonly logger = new Logger(ExifReaderAdapter.name);

  async readExifData(filePath: string): Promise<ExifData | null> {
    try {
      const exif = (await exifr.parse(filePath)) as ExifResult | null;
      if (!exif) {
        return null;
      }

      return new ExifData({
        camera: `${exif.Make || ''} ${exif.Model || ''}`.trim(),
        dateTaken: exif.DateTimeOriginal
          ? new Date(exif.DateTimeOriginal)
          : undefined,
        focalLength: exif.FocalLength,
        aperture: exif.FNumber,
        iso: exif.ISO,
        gpsLocation:
          exif.latitude && exif.longitude
            ? {
                latitude: exif.latitude,
                longitude: exif.longitude,
              }
            : undefined,
      });
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }
}
