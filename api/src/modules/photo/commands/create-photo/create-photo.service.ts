import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePhotoCommand } from '@modules/photo/commands/create-photo/create-photo.command';
import { PhotoDaoPort } from '@modules/photo/database/photo.dao.port';
import { PhotoEntity } from '@modules/photo/domain/photo.entity';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { Ok, Result } from 'oxide.ts';
import { AggregateID } from '@libs/ddd';

@CommandHandler(CreatePhotoCommand)
export class CreatePhotoService implements ICommandHandler<CreatePhotoCommand> {
  constructor(protected readonly photoDao: PhotoDaoPort) {}
  async execute(
    command: CreatePhotoCommand,
  ): Promise<Result<AggregateID, Error>> {
    const filePath = new FilePath({
      value: command.relativePath,
    });
    const photo = PhotoEntity.create(
      {
        path: filePath,
        mimeType: filePath.getMimeTypeOrFail(),
        name: filePath.filename,
        dimensions: new ImageDimensions({
          width: command.width,
          height: command.height,
        }),
      },
      command.size,
    );

    const created = await this.photoDao.create(photo);
    return Ok(created.id);
  }
}
