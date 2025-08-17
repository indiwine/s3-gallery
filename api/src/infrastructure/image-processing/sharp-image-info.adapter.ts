import { Injectable, Logger } from '@nestjs/common';
import Sharp from 'sharp';
import { ImageInfoPort } from '@src/infrastructure/ports/image-info.port';
import { ImageProcessingFailedException } from '@src/infrastructure/image-processing/exceptions/image-processing.exceptions';

@Injectable()
export class SharpImageInfoAdapter implements ImageInfoPort {
  private readonly logger = new Logger(SharpImageInfoAdapter.name);

  async getDimensions(
    filePath: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const metadata = await Sharp(filePath).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      const orientation = metadata.orientation;

      // EXIF orientation 5,6,7,8 correspond to 90/270 rotations where width/height swap
      const shouldSwap =
        orientation !== undefined && [5, 6, 7, 8].includes(orientation);

      return shouldSwap ? { width: height, height: width } : { width, height };
    } catch (error) {
      this.logger.error(`Failed to read image metadata for ${filePath}`, error);
      throw new ImageProcessingFailedException(
        `Failed to read image metadata for ${filePath}`,
        error as Error,
      );
    }
  }
}
