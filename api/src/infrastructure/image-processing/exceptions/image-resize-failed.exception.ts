import { ExceptionBase } from '@libs/exceptions';

export class ImageResizeFailedException extends ExceptionBase {
  code: string = 'IMAGE-RESIZE.FAILED';
}
