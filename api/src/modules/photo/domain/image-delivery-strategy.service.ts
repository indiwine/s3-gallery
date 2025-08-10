import { Injectable } from '@nestjs/common';
import { ImageSize, SupportedImageMimeTypes } from './file.types';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { ArgumentInvalidException } from '@libs/exceptions';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { ImageThumbnailDefinitionInterface } from '@modules/photo/interfaces/image-thumbnail-definition.interface';

interface FormatStrategy {
  shouldConvert: boolean;
  reason: string;
  generateSizes: ImageSize[];
}

class DeliveryStrategy {
  constructor(
    public readonly shouldConvert: boolean,
    public readonly targetMimeType: MimeType,
    public readonly sizesToGenerate: ImageSize[],
    public readonly reason: string,
  ) {}
}

@Injectable()
export class ImageDeliveryStrategyService {
  private static readonly FORMAT_STRATEGIES: Record<
    SupportedImageMimeTypes,
    FormatStrategy
  > = {
    // Legacy formats - convert for better compression
    [SupportedImageMimeTypes.JPEG]: {
      shouldConvert: true,
      reason: 'AVIF provides better compression than JPEG',
      generateSizes: [
        ImageSize.THUMBNAIL,
        ImageSize.SMALL,
        ImageSize.MEDIUM,
        ImageSize.LARGE,
      ],
    },
    [SupportedImageMimeTypes.PNG]: {
      shouldConvert: true,
      reason: 'AVIF supports transparency with better compression',
      generateSizes: [ImageSize.THUMBNAIL, ImageSize.SMALL, ImageSize.MEDIUM],
    },

    // Already modern but still convert for consistency
    [SupportedImageMimeTypes.WEBP]: {
      shouldConvert: true,
      reason: 'AVIF provides even better compression than WebP',
      generateSizes: [ImageSize.THUMBNAIL, ImageSize.SMALL, ImageSize.MEDIUM],
    },

    // GIFs - special handling needed
    [SupportedImageMimeTypes.GIF]: {
      shouldConvert: false, // Keep as GIF for animations
      reason: 'GIF animations cannot be converted to AVIF',
      generateSizes: [ImageSize.THUMBNAIL, ImageSize.SMALL], // But create smaller GIFs
    },

    [SupportedImageMimeTypes.TIFF]: {
      shouldConvert: true,
      reason: 'AVIF provides better compression than TIFF',
      generateSizes: [
        ImageSize.THUMBNAIL,
        ImageSize.SMALL,
        ImageSize.MEDIUM,
        ImageSize.LARGE,
      ],
    },
    [SupportedImageMimeTypes.AVIF]: {
      shouldConvert: true,
      reason: 'Already AVIF, need to resize for better compression',
      generateSizes: [
        ImageSize.THUMBNAIL,
        ImageSize.SMALL,
        ImageSize.MEDIUM,
        ImageSize.LARGE,
      ],
    },
  };

  getDeliveryStrategy(originalMimeType: MimeType): DeliveryStrategy {
    const strategy =
      ImageDeliveryStrategyService.FORMAT_STRATEGIES[originalMimeType.typeEnum];

    if (!strategy) {
      throw new ArgumentInvalidException(
        `No delivery strategy for ${originalMimeType.typeEnum}`,
      );
    }

    return new DeliveryStrategy(
      strategy.shouldConvert,
      strategy.shouldConvert
        ? new MimeType({ value: 'image/avif' })
        : originalMimeType,
      strategy.generateSizes,
      strategy.reason,
    );
  }

  shouldCreateSize(
    originalDimensions: ImageDimensions,
    targetSize: ImageSize,
    targetDefinition: ImageThumbnailDefinitionInterface,
  ): boolean {
    // Always create thumbnails and small sizes for web delivery
    if ([ImageSize.THUMBNAIL, ImageSize.SMALL].includes(targetSize)) {
      return true;
    }

    // For larger sizes, check if it makes sense
    const ratio = this.calculateDimensionRatio(
      originalDimensions,
      targetDefinition,
    );
    return ratio > 1.2; // Only if original is at least 20% larger
  }

  private calculateDimensionRatio(
    original: ImageDimensions,
    target: ImageThumbnailDefinitionInterface,
  ): number {
    const orig = original.unpack();

    if (target.highest) {
      const maxOriginal = Math.max(orig.width, orig.height);
      return maxOriginal / target.highest;
    }

    // Handle width/height cases...
    return 1;
  }
}
