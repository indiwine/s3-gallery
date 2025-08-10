import { Mapper } from '@libs/ddd';
import { FileEntity } from '@modules/photo/domain/file.entity';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { FileSize } from '@modules/photo/domain/value-objects/file-size.value-object';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { S3Status } from './domain/photo.types';
import { ImageSize } from '@modules/photo/domain/file.types';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';

@Injectable()
export class FileMapper
  implements Mapper<FileEntity, Omit<Prisma.FileCreateInput, 'photo'>>
{
  toDomain(record: Prisma.FileGetPayload<any>): FileEntity {
    return new FileEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        size: new FileSize({ value: record.fileSize }),
        s3Status: record.status as S3Status,
        dimensions: new ImageDimensions({
          width: record.width,
          height: record.height,
        }),
        path: new FilePath({ value: record.path }),
        imageSize: record.imageSize as ImageSize,
        mimeType: new MimeType({ value: record.mimeType }),
      },
    });
  }

  toPersistence(entity: FileEntity): Omit<Prisma.FileCreateInput, 'photo'> {
    const rawProps = entity.getProps();
    return {
      height: rawProps.dimensions.unpack().height,
      width: rawProps.dimensions.unpack().width,
      imageSize: rawProps.imageSize,
      path: rawProps.path.unpack(),
      fileSize: rawProps.size.unpack(),
      status: rawProps.s3Status,
      createdAt: rawProps.createdAt,
      updatedAt: rawProps.updatedAt,
      mimeType: rawProps.mimeType.unpack(),
    };
  }

  toResponse(entity: FileEntity): any {
    return undefined;
  }
}
