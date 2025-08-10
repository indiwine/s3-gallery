import { FileEntity } from '@modules/photo/domain/file.entity';
import { ImageSize } from '@modules/photo/domain/file.types';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';

export class PathGenerationRequest {
  constructor(
    public readonly originalFile: FileEntity,
    public readonly targetSize: ImageSize,
    public readonly targetMimeType: MimeType,
    public readonly operation: 'resize' | 'backup' = 'resize',
  ) {}
}
