import { DaoPort } from '@libs/ddd';
import { PhotoEntity } from '@modules/photo/domain/photo.entity';

export interface PhotoDaoPort extends DaoPort {
  create(photo: PhotoEntity): Promise<PhotoEntity>;
  findByIdOrFail(id: string): Promise<PhotoEntity>;
  findByFilePath(filePath: string): Promise<PhotoEntity | null>;
  update(photo: PhotoEntity): Promise<PhotoEntity>;
}
