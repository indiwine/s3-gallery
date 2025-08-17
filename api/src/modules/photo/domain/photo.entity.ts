import { AggregateRoot } from '@libs/ddd';
import { PhotoProps, S3Status } from '@modules/photo/domain/photo.types';
import { FileEntity } from '@modules/photo/domain/file.entity';
import { randomUUID } from 'crypto';

import { ImageSize } from '@modules/photo/domain/file.types';
import { FileSize } from '@modules/photo/domain/value-objects/file-size.value-object';
import { MimeType } from '@modules/photo/domain/value-objects/mime-type.value-object';
import { ImageDimensions } from '@modules/photo/domain/value-objects/image-dimensions.value-object';
import { ExifData } from '@modules/photo/domain/value-objects/exif-data.value-object';
import { OriginalFileNotFoundException } from '@modules/photo/exceptions/photo.exceptions';

export class PhotoEntity extends AggregateRoot<PhotoProps> {
  protected _id: string;

  private files: FileEntity[] = [];

  static create(props: PhotoProps, fileSize: number): PhotoEntity {
    const photo = new PhotoEntity({
      id: randomUUID(),
      props: {
        ...props,
        s3Status: S3Status.PENDING,
      },
    });

    // Business rule - at leas one file must be present
    photo.addFile(
      FileEntity.create({
        imageSize: ImageSize.ORIGINAL,
        path: props.path,
        mimeType: props.mimeType,
        dimensions: props.dimensions,
        s3Status: S3Status.PENDING,
        size: new FileSize({ value: fileSize }),
      }),
    );

    return photo;
  }

  get dimensions(): ImageDimensions {
    return this.props.dimensions;
  }

  get mimeType(): MimeType {
    return this.props.mimeType;
  }

  getFiles(): FileEntity[] {
    return [...this.files];
  }

  addFiles(files: FileEntity[]): void {
    this.files.push(...files);
  }

  addFile(file: FileEntity): void {
    this.files.push(file);
  }

  setExifData(exifData: ExifData): void {
    this.props.exif = exifData;
  }

  getOriginalFile(): FileEntity | undefined {
    return this.files.find((file) => file.isOriginal());
  }

  getOriginalFileOrFail(): FileEntity {
    const originalFile = this.getOriginalFile();
    if (!originalFile) {
      throw new OriginalFileNotFoundException();
    }
    return originalFile;
  }

  validate(): void {}
}
