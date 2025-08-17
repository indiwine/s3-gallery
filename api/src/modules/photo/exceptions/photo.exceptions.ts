import { NotFoundException } from '@libs/exceptions';

export class OriginalFileNotFoundException extends NotFoundException {
  static readonly message: string = 'Original file not found';
  readonly code: string = 'PHOTO.ORIGINAL_NOT_FOUND';
  constructor(message: string = OriginalFileNotFoundException.message) {
    super(message);
  }
}
