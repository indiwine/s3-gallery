import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { PhotoModule } from './modules/photo/photo.module';
import { ClsModule } from 'nestjs-cls';
import { CqrsModule } from '@nestjs/cqrs';
import { ExifModule } from './infrastructure/adapters/exif/exif.module';
import { FileScannerModule } from './infrastructure/file-scanner/file-scanner.module';
import { ImageResizeModule } from './infrastructure/image-resize/image-resize.module';
import { StorageModule } from './infrastructure/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
    CqrsModule.forRoot(),
    PrismaModule,
    PhotoModule,
    ExifModule,
    FileScannerModule,
    ImageResizeModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
