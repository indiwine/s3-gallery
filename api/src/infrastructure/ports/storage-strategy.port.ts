import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';
import { PathGenerationRequest } from '@modules/photo/dtos/path-generation-request.dto';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { StorageFileInfoInterface } from '@src/infrastructure/interfaces/storage-file-info.interface';

export interface StorageStrategyPort {
  // Phase 1: Prepare temp processing
  createProcessingSession(): Promise<ProcessingSessionInterface>;
  getTempPath(session: ProcessingSessionInterface, filename: string): string;

  // Phase 2: Commit or rollback
  commitSession(session: ProcessingSessionInterface): Promise<void>;
  rollbackSession(session: ProcessingSessionInterface): Promise<void>;

  // Path generation
  generatePath(request: PathGenerationRequest): FilePath;

  // File scanning
  scan(basePath?: string): AsyncGenerator<StorageFileInfoInterface>;

  // Ensure readable local file path for further processing
  getLocalFilePath(
    file: StorageFileInfoInterface,
    session?: ProcessingSessionInterface,
  ): Promise<string>;
}
