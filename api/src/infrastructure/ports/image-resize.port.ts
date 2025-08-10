import { ImageResizeParamsInterface } from '@src/infrastructure/interfaces/image-resize-params.interface';
import { TempProcessedFileDto } from '@modules/photo/dtos/temp-processed-file.dto';
import { ProcessingSessionInterface } from '@src/infrastructure/interfaces/processing-session.interface';

export interface ImageResizePort {
  /**
   * @throws ImageResizeFailedException
   * @param params
   * @param session
   */
  resize(
    params: ImageResizeParamsInterface,
    session: ProcessingSessionInterface,
  ): Promise<TempProcessedFileDto>;
}
