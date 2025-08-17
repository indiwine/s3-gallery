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

export class DirectoryEntryPathException extends StorageException {
  static readonly message: string =
    'Cannot get local file path for a directory entry';
  public readonly code: string = 'STORAGE.DIRECTORY_ENTRY_PATH';
  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? DirectoryEntryPathException.message, cause, metadata);
  }
}

export class EmptyS3ObjectBodyException extends StorageException {
  static readonly message: string = 'Empty S3 object body';
  public readonly code: string = 'STORAGE.S3_EMPTY_BODY';
  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? EmptyS3ObjectBodyException.message, cause, metadata);
  }
}

export class UnsupportedStorageTypeException extends StorageException {
  static readonly message: string = 'Unsupported storage type';
  public readonly code: string = 'STORAGE.UNSUPPORTED_TYPE';
  constructor(message?: string, cause?: Error, metadata?: unknown) {
    super(message ?? UnsupportedStorageTypeException.message, cause, metadata);
  }
}
