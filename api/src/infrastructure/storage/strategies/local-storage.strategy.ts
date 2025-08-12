import { Inject, Injectable } from '@nestjs/common';
import { StorageCommitException } from '../exceptions/storage.exceptions';
import { dirname, join } from 'path';
import * as fs from 'fs';
import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';
import { PathGenerationRequest } from '@modules/photo/dtos/path-generation-request.dto';
import { AbstractStorageStrategy } from './abstract-storage.strategy';
import { LocalStorageConfigInterface } from '@src/infrastructure/storage/interfaces/local-storage-config.interface';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { walkStream } from '@nodelib/fs.walk';
import { StorageFileInfoInterface } from '@src/infrastructure/interfaces/storage-file-info.interface';
import type { Entry } from '@nodelib/fs.walk/out/types';

@Injectable()
export class LocalStorageStrategy extends AbstractStorageStrategy {
  constructor(
    @Inject('STORAGE_CONFIG')
    private readonly config: LocalStorageConfigInterface,
  ) {
    super();
  }

  async commitSession(session: ProcessingSessionInterface): Promise<void> {
    this.logger.log(
      `Committing session ${session.sessionId} with ${session.processedFiles.length} files`,
    );

    try {
      // Move all files from temp to final destinations
      for (const processedFile of session.processedFiles) {
        const finalPath = this.getFullPath(processedFile.targetStoragePath);

        // Ensure target directory exists
        await fs.promises.mkdir(dirname(finalPath), { recursive: true });

        // Move file from temp to final location
        await fs.promises.rename(processedFile.tempPath, finalPath);

        this.logger.debug(`Moved ${processedFile.tempPath} -> ${finalPath}`);
      }

      // Clean up temp directory
      await this.cleanupTempDirectory(session.tempDirectory);
    } catch (error) {
      const e = error as Error;
      this.logger.error(`Failed to commit session ${session.sessionId}`, error);
      await this.rollbackSession(session);
      throw new StorageCommitException(`Session commit failed: ${e.message}`);
    }
  }

  async cleanUpPartiallyCommittedFiles(
    session: ProcessingSessionInterface,
  ): Promise<void> {
    try {
      for (const processedFile of session.processedFiles) {
        const finalPath = this.getFullPath(processedFile.targetStoragePath);
        try {
          await fs.promises.unlink(finalPath);
          this.logger.debug(`Removed partially committed file: ${finalPath}`);
        } catch (err) {
          const e = err as NodeJS.ErrnoException;
          if (e.code !== 'ENOENT') {
            this.logger.error(
              `Failed to remove partially committed file: ${finalPath}`,
              err,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed during cleanup of partially moved files',
        error,
      );
    }
  }

  async rollbackSession(session: ProcessingSessionInterface): Promise<void> {
    this.logger.warn(`Rolling back session ${session.sessionId}`);

    // Always attempt to clean up the temp directory as well
    try {
      await this.cleanUpPartiallyCommittedFiles(session);
      await this.cleanupTempDirectory(session.tempDirectory);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup temp directory: ${session.tempDirectory}`,
        error,
      );
    }
  }

  generatePath(request: PathGenerationRequest): FilePath {
    const { originalFile, targetSize, targetMimeType, operation } = request;

    if (operation === 'backup') {
      return originalFile.path;
    }

    const extension = this.getExtensionFromMimeType(targetMimeType);
    const path = `processed/${targetSize}/${originalFile.id}.${extension}`;
    return new FilePath({ value: path });
  }

  async *scan(basePath?: string): AsyncGenerator<StorageFileInfoInterface> {
    const scanPath = basePath
      ? join(this.config.basePath, basePath)
      : this.config.basePath;

    const files = walkStream(scanPath, { stats: true });
    for await (const file of files) {
      const entry = file as Entry;
      const relativePath = entry.path
        .replace(this.config.basePath, '')
        .replace(/^\//, '');

      yield {
        path: relativePath,
        name: entry.name,
        size: entry.stats?.size || 0,
        lastModified: entry.stats?.mtime || new Date(),
        isDirectory: entry.dirent.isDirectory(),
      };
    }
  }

  private getFullPath(path: FilePath): string {
    return join(this.config.basePath, path.relativePath);
  }
}
