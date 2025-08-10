import { Inject, Injectable, Logger } from '@nestjs/common';
import Sharp from 'sharp';
import { ImageResizePort } from '@src/infrastructure/ports/image-resize.port';
import { ImageResizeParamsInterface } from '../interfaces/image-resize-params.interface';
import { ImageSize } from '@modules/photo/domain/file.types';
import { FileEntity } from '@modules/photo/domain/file.entity';
import { FileSize } from '@modules/photo/domain/value-objects/file-size.value-object';
import { S3Status } from '@modules/photo/domain/photo.types';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { ImageResizeFailedException } from '@src/infrastructure/image-resize/exceptions/image-resize-failed.exception';
import { STORAGE_STRATEGY_TOKEN } from '@src/infrastructure/storage/storage.di-tokens';
import { StorageStrategyPort } from '@src/infrastructure/ports/storage-strategy.port';
import { PathGenerationRequest } from '@modules/photo/dtos/path-generation-request.dto';
import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';
import { nanoid } from 'nanoid';
import { TempProcessedFileDto } from '@modules/photo/dtos/temp-processed-file.dto';

@Injectable()
export class AvifImageResizeAdapter implements ImageResizePort {
  protected readonly logger = new Logger(AvifImageResizeAdapter.name);

  constructor(
    @Inject(STORAGE_STRATEGY_TOKEN)
    private readonly storageStrategy: StorageStrategyPort,
  ) {}

  async resize(
    params: ImageResizeParamsInterface,
    session: ProcessingSessionInterface,
  ): Promise<TempProcessedFileDto> {
    const { filePath, imageSize, originalFile } = params;
    const sharpInst = Sharp(filePath);

    const pathRequest = new PathGenerationRequest(
      originalFile,
      imageSize,
      new MimeType({ value: 'image/avif' }),
      'resize',
    );

    const storagePath = this.storageStrategy.generatePath(pathRequest);
    const tmpFilePath = this.storageStrategy.getTempPath(
      session,
      `${originalFile.id}_${imageSize}_${nanoid()}.avif`,
    );

    try {
      sharpInst
        .autoOrient()
        .resize({
          ...this.scaleImage(params),
          withoutEnlargement: true,
          kernel: Sharp.kernel.mks2021,
        })
        .avif(this.defineAvifSaveOptions(params));

      const result = await sharpInst.toFile(tmpFilePath);

      const fileEntity = FileEntity.create({
        size: new FileSize({ value: result.size }),
        s3Status: S3Status.PENDING, // Pending since it's just been created, it might not be uploaded yet
        dimensions: new ImageDimensions({
          width: result.width,
          height: result.height,
        }),
        imageSize: imageSize,
        mimeType: new MimeType({ value: 'image/avif' }),
        path: storagePath,
      });

      return new TempProcessedFileDto(tmpFilePath, storagePath, fileEntity);
    } catch (error) {
      this.logger.error(error);
      throw new ImageResizeFailedException(
        `Failed to resize image: ${filePath}`,
        error,
      );
    }
  }

  scaleImage(
    params: ImageResizeParamsInterface,
  ): Pick<Sharp.ResizeOptions, 'width' | 'height' | 'fit'> {
    const { originalImageDimensions } = params;
    const { width, height, highest } = params.thumbnailDefinition;

    // If both width and height is passed, we do the best effort to fit with cropping
    if (width && height) {
      return {
        width,
        height,
        fit: 'cover',
      };
    }

    // highest provide, we will calculate a new dimensions
    if (highest) {
      const smallestDimension =
        originalImageDimensions.calculateDimensionsFromHighest(highest);
      return {
        width: smallestDimension.unpack().width,
        height: smallestDimension.unpack().height,
        fit: 'inside',
      };
    }

    // If only width is passed, we will scale the image to the width
    if (width) {
      return {
        width,
        height: undefined,
        fit: 'inside',
      };
    }

    // If only height is passed, we will scale the image to the height
    if (height) {
      return {
        width: undefined,
        height,
        fit: 'inside',
      };
    }

    // If no width or height is passed, we will scale the image to the highest dimension
    // this is should not be the case, just the fallback
    return {
      width: undefined,
      height: undefined,
    };
  }

  defineAvifSaveOptions(params: ImageResizeParamsInterface): Sharp.AvifOptions {
    switch (params.imageSize) {
      case ImageSize.THUMBNAIL:
      case ImageSize.SMALL:
        // the smallest images, we want to squeeze as much from them
        return {
          chromaSubsampling: '4:2:0',
          quality: 40,
          effort: 9,
        };
      case ImageSize.MEDIUM:
        return {
          chromaSubsampling: '4:2:0',
          quality: 60,
          effort: 9,
        };
      case ImageSize.LARGE:
        return {
          chromaSubsampling: '4:4:4',
          quality: 80,
          effort: 9,
        };
      default:
        // should not be the case:
        return {};
    }
  }
}
