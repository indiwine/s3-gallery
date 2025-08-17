import { ExceptionBase } from './exception.base';

export class NotImplementedException extends ExceptionBase {
  static readonly message = 'Method not implemented';
  readonly code = 'GENERIC.NOT_IMPLEMENTED';
  constructor(message: string = NotImplementedException.message) {
    super(message);
  }
}
