import { ExceptionBase } from '@libs/exceptions';

export class ImageProcessingFailedException extends ExceptionBase {
  static readonly message: string = 'Image processing failed';
  public readonly code: string = 'IMAGE_PROCESSING.FAILED';
  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? ImageProcessingFailedException.message, cause, metadata);
  }
}
