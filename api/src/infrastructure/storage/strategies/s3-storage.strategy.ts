import { Inject, Injectable } from '@nestjs/common';
import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  StorageCommitException,
  StorageException,
} from '../exceptions/storage.exceptions';
import * as fs from 'fs';
import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';
import { PathGenerationRequest } from '@modules/photo/dtos/path-generation-request.dto';
import { StoragePath } from '@modules/photo/domain/value-objects/storage-path.value-object.';
import { AbstractStorageStrategy } from './abstract-storage.strategy';
import { S3StorageConfigInterface } from '@src/infrastructure/storage/interfaces/s3-storage-config.interface';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';

@Injectable()
export class S3StorageStrategy extends AbstractStorageStrategy {
  constructor(
    @Inject('STORAGE_CONFIG') private readonly config: S3StorageConfigInterface,
    private readonly s3Client: S3Client,
  ) {
    super();
  }

  async commitSession(session: ProcessingSessionInterface): Promise<void> {
    this.logger.log(
      `Committing S3 session ${session.sessionId} with ${session.processedFiles.length} files`,
    );

    // Abort all in-flight uploads if any single upload fails
    const abortController = new AbortController();
    const uploadedKeys = new Set<string>();

    const uploadPromises = session.processedFiles.map(async (processedFile) => {
      const key = processedFile.targetStoragePath.relativePath;

      // Use stream to reduce memory footprint and allow cancelation
      const readStream = fs.createReadStream(processedFile.tempPath);
      const onAbort = () => {
        try {
          readStream.destroy(new Error('Upload aborted'));
        } catch {
          // ignore
        }
      };
      abortController.signal.addEventListener('abort', onAbort, { once: true });

      try {
        const uploadCommand = new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
          Body: readStream,
          ContentType: processedFile.fileEntity.mimeType,
          // S3 Metadata values must be strings
          Metadata: {
            originalId: String(processedFile.fileEntity.id),
            imageSize: String(processedFile.fileEntity.imageSize),
            sessionId: String(session.sessionId),
          },
        });

        await this.s3Client.send(uploadCommand, {
          abortSignal: abortController.signal,
        });

        uploadedKeys.add(key);

        this.logger.debug(
          `Uploaded ${processedFile.tempPath} -> s3://${this.config.bucketName}/${key}`,
        );
      } catch (error) {
        // Abort other in-flight uploads
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
        this.logger.error(`Failed to upload ${processedFile.tempPath}`, error);
        throw error;
      } finally {
        abortController.signal.removeEventListener('abort', onAbort);
      }
    });

    try {
      // Upload all files in parallel
      await Promise.all(uploadPromises);

      // Clean up temp directory
      await this.cleanupTempDirectory(session.tempDirectory);
    } catch (error) {
      this.logger.error(
        `Failed to commit S3 session ${session.sessionId}`,
        error,
      );

      // Delete any objects that might have been uploaded before failure
      await this.rollbackSession(session);

      const message = error instanceof Error ? error.message : String(error);
      const cause = error instanceof Error ? error : new Error(message);
      throw new StorageCommitException(
        `S3 session commit failed: ${message}`,
        cause,
      );
    }
  }

  async rollbackSession(session: ProcessingSessionInterface): Promise<void> {
    this.logger.warn(`Rolling back S3 session ${session.sessionId}`);

    // Attempt to remove any uploaded files for this session
    try {
      const deletions = session.processedFiles.map(async (processedFile) => {
        const key = processedFile.targetStoragePath.relativePath;
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.config.bucketName,
              Key: key,
            }),
          );
          this.logger.debug(
            `Removed partially committed file from S3: s3://${this.config.bucketName}/${key}`,
          );
        } catch (err) {
          // S3 DeleteObject is idempotent; log other errors (e.g., network)
          this.logger.error(
            `Failed to remove partially committed file from S3: s3://${this.config.bucketName}/${key}`,
            err,
          );
        }
      });

      await Promise.allSettled(deletions);
    } catch (error) {
      this.logger.error(
        'Error while removing uploaded files during rollback',
        error,
      );
    }

    // Always attempt to clean up the temp directory as well
    try {
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

    const basePrefix = this.config.basePath ? `${this.config.basePath}/` : '';

    if (operation === 'backup') {
      const path = `${basePrefix}originals/${originalFile.id}/${originalFile.path.filename}`;
      return new FilePath({ value: path });
    }

    const extension = this.getExtensionFromMimeType(targetMimeType);
    const path = `${basePrefix}processed/${targetSize}/${originalFile.id}.${extension}`;
    return new FilePath({ value: path });
  }
}
