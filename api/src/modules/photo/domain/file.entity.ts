import { AggregateRoot } from '@libs/ddd';
import {
  FileProps,
  ImageSize,
  SupportedImageMimeTypes,
} from '@modules/photo/domain/file.types';
import { randomUUID } from 'crypto';

export class FileEntity extends AggregateRoot<FileProps> {
  protected _id: string;

  static create(props: FileProps): FileEntity {
    const file = new FileEntity({
      id: randomUUID(),
      props,
    });

    return file;
  }

  get mimeType(): SupportedImageMimeTypes {
    return this.props.mimeType.typeEnum;
  }

  get imageSize(): ImageSize {
    return this.props.imageSize;
  }

  get path() {
    return this.props.path;
  }

  isOriginal() {
    return this.props.imageSize === ImageSize.ORIGINAL;
  }

  public validate(): void {
    // todo
  }
}
