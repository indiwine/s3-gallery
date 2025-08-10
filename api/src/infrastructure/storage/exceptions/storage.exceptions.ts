import { ExceptionBase } from '@libs/exceptions';

export class StorageException extends ExceptionBase {
  static readonly message: string = 'Storage operation failed';

  public readonly code: string = 'STORAGE.OPERATION_FAILED';

  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? StorageException.message, cause, metadata);
  }
}

export class StorageCommitException extends StorageException {
  static readonly message: string = 'Storage commit failed';

  public readonly code: string = 'STORAGE.COMMIT_FAILED';

  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? StorageCommitException.message, cause, metadata);
  }
}

export class ImageProcessingFailedException extends ExceptionBase {
  static readonly message: string = 'Image processing failed';

  public readonly code: string = 'IMAGE_PROCESSING.FAILED';

  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? ImageProcessingFailedException.message, cause, metadata);
  }
}
