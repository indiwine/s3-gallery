import { PhotoDaoPort } from '@modules/photo/database/photo.dao.port';
import { Injectable } from '@nestjs/common';
import { PrismaDaoBase } from '@libs/db/prisma-dao.base';
import { PhotoEntity } from '@modules/photo/domain/photo.entity';
import { PhotoMapper } from '@modules/photo/photo.mapper';
import { PrismaService } from '@src/infrastructure/prisma/prisma.service';
import { FileMapper } from '../file.mapper';
import { Prisma } from '@prisma/client';

type PrismaPhoto = Prisma.PhotoGetPayload<{
  include: {
    files: true;
  };
}>;

@Injectable()
export class PhotoDao extends PrismaDaoBase implements PhotoDaoPort {
  constructor(
    readonly photoMapper: PhotoMapper,
    readonly fileMapper: FileMapper,
    readonly prismaService: PrismaService,
  ) {
    super();
  }
  async findByIdOrFail(id: string): Promise<PhotoEntity> {
    const ormPhoto = await this.prismaService.photo.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        files: true,
      },
    });
    return this.ormToDomain(ormPhoto);
  }
  async findByFilePath(filePath: string): Promise<PhotoEntity | null> {
    const ormPhoto = await this.prismaService.photo.findFirst({
      where: {
        path: filePath,
      },
      include: {
        files: true,
      },
    });
    return ormPhoto ? this.ormToDomain(ormPhoto) : null;
  }

  async update(photo: PhotoEntity): Promise<PhotoEntity> {
    const ormPhoto = this.photoMapper.toPersistence(photo);

    const updated = await this.prismaService.$transaction(async (tx) => {
      for (const file of photo.getFiles()) {
        const ormFile = this.fileMapper.toPersistence(file);
        await tx.file.upsert({
          where: {
            id: file.id,
          },
          update: ormFile,
          create: {
            ...ormFile,
            photo: {
              connect: {
                id: photo.id,
              },
            },
          },
        });
      }

      return tx.photo.update({
        where: {
          id: photo.id,
        },
        include: {
          files: true,
        },
        data: {
          ...ormPhoto,
        },
      });
    });

    return this.ormToDomain(updated);
  }

  async create(photo: PhotoEntity): Promise<PhotoEntity> {
    const ormPhoto = this.photoMapper.toPersistence(photo);
    const ormFiles = photo
      .getFiles()
      .map((file) => this.fileMapper.toPersistence(file));
    const created = await this.prismaService.photo.create({
      data: {
        ...ormPhoto,
        files: {
          create: ormFiles,
        },
      },
    });
    return this.photoMapper.toDomain(created);
  }

  private ormToDomain(photo: PrismaPhoto): PhotoEntity {
    const files = photo.files.map((file) => this.fileMapper.toDomain(file));
    const photoEntity = this.photoMapper.toDomain(photo);
    photoEntity.addFiles(files);
    return photoEntity;
  }
}
