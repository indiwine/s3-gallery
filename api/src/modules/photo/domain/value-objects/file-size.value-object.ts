import { ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';

export class FileSize extends ValueObject<number> {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  protected validate(props: { value: number }): void {
    if (props.value < 0) {
      throw new ArgumentInvalidException('File size cannot be negative');
    }

    if (props.value > FileSize.MAX_FILE_SIZE) {
      throw new ArgumentInvalidException('File size exceeds maximum limit');
    }
  }

  get bytes(): number {
    return this.props.value;
  }

  get kilobytes(): number {
    return this.props.value / 1024;
  }

  get megabytes(): number {
    return this.props.value / (1024 * 1024);
  }

  get humanReadable(): string {
    if (this.megabytes >= 1) {
      return `${this.megabytes.toFixed(2)} MB`;
    }
    return `${this.kilobytes.toFixed(2)} KB`;
  }
}
