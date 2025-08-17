import { Mapper } from '@libs/ddd';
import { PhotoEntity } from '@modules/photo/domain/photo.entity';
import { Prisma } from '@prisma/client';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { S3Status } from '@modules/photo/domain/photo.types';
import {
  ExifData,
  ExifDataProps,
} from '@modules/photo/domain/value-objects/exif-data.value-object';
import { Injectable } from '@nestjs/common';
import { NotImplementedException } from '@libs/exceptions/not-implemented.exception';

@Injectable()
export class PhotoMapper
  implements Mapper<PhotoEntity, Prisma.PhotoCreateInput>
{
  toPersistence(entity: PhotoEntity): Prisma.PhotoCreateInput {
    const rawProps = entity.getProps();
    return {
      id: rawProps.id,
      createdAt: rawProps.createdAt,
      updatedAt: rawProps.updatedAt,
      name: rawProps.name,
      path: rawProps.path.unpack(),
      exifData: rawProps.exif?.unpack(),
      userId: 'unknown',
      width: rawProps.dimensions.unpack().width,
      height: rawProps.dimensions.unpack().height,
      mimeType: rawProps.mimeType.unpack(),
    };
  }

  toDomain(record: Prisma.PhotoGetPayload<any>): PhotoEntity {
    return new PhotoEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        path: new FilePath({ value: record.path }),
        mimeType: new MimeType({ value: record.mimeType }),
        name: record.name,
        dimensions: new ImageDimensions({
          width: record.width,
          height: record.height,
        }),
        s3Status: record.status as S3Status,
        exif: record.exifData
          ? new ExifData(record.exifData as ExifDataProps)
          : undefined,
      },
    });
  }
  toResponse() {
    throw new NotImplementedException();
  }
}
