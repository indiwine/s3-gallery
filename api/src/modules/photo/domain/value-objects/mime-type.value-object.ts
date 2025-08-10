import { ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';
import { SupportedFileFormatsService } from '@modules/photo/domain/supported-file-formats.service';
import { SupportedImageMimeTypes } from '@modules/photo/domain/file.types';

export class MimeType extends ValueObject<string> {
  protected validate(props: { value: string }): void {
    if (
      !SupportedFileFormatsService.isMimeTypeSupported(
        props.value as SupportedImageMimeTypes,
      )
    ) {
      throw new ArgumentInvalidException(
        `Unsupported mime type: ${props.value}`,
      );
    }
  }

  get isJpeg(): boolean {
    return this.props.value === 'image/jpeg';
  }

  get isPng(): boolean {
    return this.props.value === 'image/png';
  }

  get typeEnum(): SupportedImageMimeTypes {
    return this.props.value as SupportedImageMimeTypes;
  }

  get supportsTransparency(): boolean {
    return ['image/png', 'image/gif', 'image/webp'].includes(this.props.value);
  }

  get fileExtension(): string[] {
    return SupportedFileFormatsService.getExtensionsFromMimeType(
      this.props.value,
    );
  }
}
