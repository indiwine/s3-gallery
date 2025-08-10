import { Injectable } from '@nestjs/common';
import { FileEntity } from '@modules/photo/domain/file.entity';
import { FilePath } from '@modules/photo/domain/value-objects/file-path.value-object';
import { PhotoEntity } from '@modules/photo/domain/photo.entity';
import { SupportedFileFormatsService } from '@modules/photo/domain/supported-file-formats.service';
import { ArgumentInvalidException } from '@libs/exceptions';

@Injectable()
export class FilePathGeneratorService {
  generateDeliveryPath(photo: PhotoEntity, targetFile: FileEntity): FilePath {
    const extension = SupportedFileFormatsService.getExtensionFromMimeType(
      targetFile.mimeType,
    );
    if (!extension) {
      throw new ArgumentInvalidException(
        `Unsupported file extension: ${extension}`,
      );
    }

    const path = `/processed/${photo.id}/${targetFile.imageSize}_${targetFile.id}.${extension}`;

    return new FilePath({ value: path });
  }
}
