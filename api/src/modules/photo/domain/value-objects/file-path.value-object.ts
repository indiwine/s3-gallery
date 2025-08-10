import { ArgumentInvalidException } from '@libs/exceptions';
import { ValueObject, ValueObjectProps } from '@libs/ddd';
import * as path from 'path';
import { SupportedFileFormatsService } from '@modules/photo/domain/supported-file-formats.service';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';

export class FilePath extends ValueObject<string> {
  protected validate(props: ValueObjectProps<string>): void {
    if (!props.value || props.value.trim().length === 0) {
      throw new ArgumentInvalidException('File path cannot be empty');
    }

    // Business rules for file paths
    if (props.value.includes('..')) {
      throw new ArgumentInvalidException(
        'File path cannot contain relative paths',
      );
    }

    if (!this.isValidS3Path(props.value)) {
      throw new ArgumentInvalidException('Invalid S3 file path format');
    }
  }

  get relativePath(): string {
    return this.props.value;
  }

  private isValidS3Path(path: string): boolean {
    // S3 path validation logic
    const s3PathRegex = /^[a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+$/;
    return s3PathRegex.test(path);
  }

  get directory(): string {
    return path.dirname(this.props.value);
  }

  get filename(): string {
    return path.basename(this.props.value);
  }

  get extension(): string {
    return path.extname(this.props.value).slice(1);
  }

  get mimeType(): MimeType | null {
    const mimeTypeString = SupportedFileFormatsService.getMimeTypeFromExtension(
      this.extension,
    );

    return mimeTypeString ? new MimeType({ value: mimeTypeString }) : null;
  }

  getMimeTypeOrFail(): MimeType {
    const mimeType = this.mimeType;
    if (!mimeType) {
      throw new ArgumentInvalidException(
        `Unsupported file extension: ${this.extension}`,
      );
    }
    return mimeType;
  }
}
