import { TempProcessedFileDto } from '@modules/photo/dtos/temp-processed-file.dto';

export interface ProcessingSessionInterface {
  readonly sessionId: string;
  readonly tempDirectory: string;
  readonly processedFiles: TempProcessedFileDto[];
}
