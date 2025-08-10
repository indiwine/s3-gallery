import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResizeImageCommand } from '@modules/photo/commands/resize-image/resize-image.command';
import { ImageDeliveryStrategyService } from '@modules/photo/domain/image-delivery-strategy.service';
import { StorageStrategyPort } from '@src/infrastructure/ports/storage-strategy.port';
import { PhotoDaoPort } from '@modules/photo/database/photo.dao.port';
import { PHOTO_DAO } from '@modules/photo/photo.di-tikens';
import { Inject } from '@nestjs/common';
import { ImageSize } from '@modules/photo/domain/file.types';
import { ImageProcessingFailedException } from '@src/infrastructure/storage/exceptions/storage.exceptions';
import { FileEntity } from '@modules/photo/domain/file.entity';
import { ImageResizePort } from '@src/infrastructure/ports/image-resize.port';
import { IMAGE_RESIZE_ADAPTER } from '@src/infrastructure/image-resize/image-resize.di-tokens';
import { ImageThumbnailDefinition } from '@modules/photo/interfaces/image-thumbnail-definition.interface';
import { STORAGE_STRATEGY_TOKEN } from '@src/infrastructure/storage/storage.di-tokens';
import { EXIF_SERVICE } from '@src/infrastructure/exif/exif.di-tokens';
import { ExifReaderPort } from '@src/infrastructure/ports/exif-reader.port';

@CommandHandler(ResizeImageCommand)
export class ResizeImageService implements ICommandHandler<ResizeImageCommand> {
  private readonly logger = new Logger(ResizeImageService.name);

  constructor(
    @Inject(IMAGE_RESIZE_ADAPTER)
    private readonly imageResizer: ImageResizePort,
    private readonly deliveryStrategy: ImageDeliveryStrategyService,
    @Inject(STORAGE_STRATEGY_TOKEN)
    private readonly storageStrategy: StorageStrategyPort,
    @Inject(PHOTO_DAO) private readonly photoDaoPort: PhotoDaoPort,
    @Inject(EXIF_SERVICE) private readonly exifReader: ExifReaderPort,
  ) {}

  async execute(command: ResizeImageCommand): Promise<ProcessImageResult> {
    const originalPhoto = await this.photoDaoPort.findByIdOrFail(
      command.photoId,
    );

    if (command.updateExifData) {
      const exifData = await this.exifReader.readExifData(command.tempFilePath);
      if (exifData) {
        originalPhoto.setExifData(exifData);
      }
    }

    // Phase 1: Create processing session
    const session = await this.storageStrategy.createProcessingSession();

    this.logger.log(
      `Starting resize session ${session.sessionId} for file ${originalPhoto.id}`,
    );

    try {
      // Phase 2: Process all sizes to temp directory
      const strategy = this.deliveryStrategy.getDeliveryStrategy(
        originalPhoto.mimeType,
      );

      for (const targetSize of strategy.sizesToGenerate) {
        const sizeConfig = this.getSizeConfiguration(targetSize);

        const shouldCreate = this.deliveryStrategy.shouldCreateSize(
          originalPhoto.dimensions,
          targetSize,
          sizeConfig,
        );

        if (!shouldCreate) {
          this.logger.debug(`Skipping ${targetSize} - original too small`);
          continue;
        }

        this.logger.debug(
          `Processing ${targetSize} for session ${session.sessionId}`,
        );

        const tempProcessedFile = await this.imageResizer.resize(
          {
            originalFile: originalPhoto.getOriginalFileOrFail(),
            filePath: command.tempFilePath,
            imageSize: targetSize,
            thumbnailDefinition: sizeConfig,
            originalImageDimensions: originalPhoto.dimensions,
          },
          session,
        );

        // Add to session for later commit
        session.processedFiles.push(tempProcessedFile);
      }

      // Phase 3: Commit all files to final storage
      await this.storageStrategy.commitSession(session);

      this.logger.log(
        `Successfully completed resize session ${session.sessionId}`,
      );

      const processedEntities = session.processedFiles.map((f) => f.fileEntity);
      originalPhoto.addFiles(processedEntities);

      // Phase 4: Update photo with new files
      await this.photoDaoPort.update(originalPhoto);

      return new ProcessImageResult(
        originalPhoto.getOriginalFileOrFail(),
        processedEntities,
      );
    } catch (error) {
      this.logger.error(`Resize session ${session.sessionId} failed`, error);

      // Phase 4: Rollback on any error
      await this.storageStrategy.rollbackSession(session);

      throw new ImageProcessingFailedException(
        `Failed to process image ${originalPhoto.id}: ${error.message}`,
        error,
      );
    }
  }

  private getSizeConfiguration(size: ImageSize): ImageThumbnailDefinition {
    const configurations: Record<
      Exclude<ImageSize, ImageSize.ORIGINAL>,
      ImageThumbnailDefinition
    > = {
      [ImageSize.THUMBNAIL]: { width: 200, height: 200 },
      [ImageSize.SMALL]: { width: 400, height: 400 },
      [ImageSize.MEDIUM]: { highest: 800 },
      [ImageSize.LARGE]: { highest: 1600 },
    };

    if (!configurations[size]) {
      throw new Error(`Unsupported image size: ${size}`);
    }

    return configurations[size as Exclude<ImageSize, ImageSize.ORIGINAL>];
  }
}

export class ProcessImageResult {
  constructor(
    public readonly originalFile: FileEntity,
    public readonly processedFiles: FileEntity[],
  ) {}
}
