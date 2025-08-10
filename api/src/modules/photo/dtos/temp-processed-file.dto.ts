import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { FileEntity } from '@modules/photo/domain/file.entity';

export class TempProcessedFileDto {
  constructor(
    public readonly tempPath: string,
    public readonly targetStoragePath: FilePath,
    public readonly fileEntity: FileEntity,
  ) {}
}
