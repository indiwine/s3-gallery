import { Logger } from '@nestjs/common';
import { StorageStrategyPort } from '@src/infrastructure/ports/storage-strategy.port';
import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';
import { PathGenerationRequest } from '@modules/photo/dtos/path-generation-request.dto';
import { StoragePath } from '@modules/photo/domain/value-objects/storage-path.value-object.';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { SupportedFileFormatsService } from '@modules/photo/domain/supported-file-formats.service';
import { nanoid } from 'nanoid';
import { join } from 'path';
import * as fs from 'fs';
import * as tmp from 'tmp-promise';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';

export abstract class AbstractStorageStrategy implements StorageStrategyPort {
  protected readonly logger = new Logger(this.constructor.name);

  async createProcessingSession(): Promise<ProcessingSessionInterface> {
    const sessionId = nanoid();

    // Use tmp-promise package for temporary directory creation
    const tempDirResult = await tmp.dir({
      prefix: 'resize-session-',
      unsafeCleanup: true,
    });

    const tempDirectory = tempDirResult.path;

    return {
      sessionId,
      tempDirectory,
      processedFiles: [],
    };
  }

  getTempPath(session: ProcessingSessionInterface, filename: string): string {
    return join(session.tempDirectory, filename);
  }

  abstract commitSession(session: ProcessingSessionInterface): Promise<void>;
  abstract rollbackSession(session: ProcessingSessionInterface): Promise<void>;
  abstract generatePath(request: PathGenerationRequest): FilePath;

  protected async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.error(`Failed to cleanup temp directory: ${tempDir}`, error);
    }
  }

  protected getExtensionFromMimeType(mimeType: MimeType): string {
    const extension = SupportedFileFormatsService.getExtensionFromMimeType(
      mimeType.typeEnum,
    );
    return extension || 'avif'; // fallback to avif if not found
  }
}
