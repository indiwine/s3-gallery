import { Injectable } from '@nestjs/common';
import { SupportedImageMimeTypes } from '@modules/photo/domain/file.types';

interface SupportedFileFormatInterface {
  mimeType: SupportedImageMimeTypes;
  extensions: string[];
}

type CompleteSupportedFormats = {
  [K in SupportedImageMimeTypes]: SupportedFileFormatInterface & {
    mimeType: K;
  };
}[SupportedImageMimeTypes][];

@Injectable()
export class SupportedFileFormatsService {
  private static readonly FORMATS: CompleteSupportedFormats = [
    { mimeType: SupportedImageMimeTypes.JPEG, extensions: ['jpg', 'jpeg'] },
    { mimeType: SupportedImageMimeTypes.PNG, extensions: ['png', 'apng'] },
    { mimeType: SupportedImageMimeTypes.GIF, extensions: ['gif'] },
    { mimeType: SupportedImageMimeTypes.WEBP, extensions: ['webp'] },
    { mimeType: SupportedImageMimeTypes.TIFF, extensions: ['tiff', 'tif'] },
    { mimeType: SupportedImageMimeTypes.AVIF, extensions: ['avif'] },
  ] as const;

  static getSupportedMimeTypes(): string[] {
    return this.FORMATS.map((format) => format.mimeType);
  }

  static getSupportedExtensions(): string[] {
    return this.FORMATS.flatMap((format) => format.extensions);
  }

  static getMimeTypeFromExtension(extension: string): string | null {
    const format = this.FORMATS.find((f) =>
      f.extensions.includes(extension.toLowerCase()),
    );
    return format?.mimeType ?? null;
  }

  static getExtensionsFromMimeType(
    mimeType: SupportedImageMimeTypes,
  ): string[] {
    const format = this.FORMATS.find((f) => f.mimeType === mimeType);
    return format?.extensions ?? [];
  }

  static getExtensionFromMimeType(
    mimeType: SupportedImageMimeTypes,
  ): string | null {
    const format = this.FORMATS.find((f) => f.mimeType === mimeType);
    return format?.extensions[0] ?? null;
  }

  static isExtensionSupported(extension: string): boolean {
    return this.getSupportedExtensions().includes(extension.toLowerCase());
  }

  static isMimeTypeSupported(mimeType: SupportedImageMimeTypes): boolean {
    return this.getSupportedMimeTypes().includes(mimeType);
  }
}
