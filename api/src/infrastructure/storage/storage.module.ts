import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

import {
  LocalStorageStrategy,
} from './strategies/local-storage.strategy';
import {
  S3StorageStrategy,
} from './strategies/s3-storage.strategy';
import { StorageStrategyPort } from '../ports/storage-strategy.port';
import { STORAGE_STRATEGY_TOKEN } from '@src/infrastructure/storage/storage.di-tokens';
import * as os from 'node:os';
import { LocalStorageConfigInterface } from '@src/infrastructure/storage/interfaces/local-storage-config.interface';
import { S3StorageConfigInterface } from '@src/infrastructure/storage/interfaces/s3-storage-config.interface';

export interface StorageModuleConfig {
  storageType?: string;
}

@Module({})
export class StorageModule {
  static forRoot(config: StorageModuleConfig = {}): DynamicModule {
    const storageProvider: Provider = {
      provide: STORAGE_STRATEGY_TOKEN,
      useFactory: (configService: ConfigService): StorageStrategyPort => {
        const storageType = configService.get<string>('STORAGE_TYPE', 'local');

        switch (storageType) {
          case 'local': {
            const localConfig: LocalStorageConfigInterface = {
              basePath: configService.get<string>(
                'LOCAL_STORAGE_BASE_PATH',
                './storage',
              ),
              tempPath: configService.get<string>(
                'LOCAL_STORAGE_TEMP_PATH',
                os.tmpdir(),
              ),
            };
            return new LocalStorageStrategy(localConfig);
          }

          case 's3': {
            const s3Config: S3StorageConfigInterface = {
              bucketName: configService.getOrThrow<string>('S3_BUCKET_NAME'),
              basePath: configService.get<string>('S3_BASE_PATH'),
              tempPath: configService.get<string>('S3_TEMP_PATH', '/tmp'),
            };

            const s3Client = new S3Client({
              region: configService.get<string>('AWS_REGION', 'us-east-1'),
              credentials: {
                accessKeyId:
                  configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: configService.getOrThrow<string>(
                  'AWS_SECRET_ACCESS_KEY',
                ),
              },
            });

            return new S3StorageStrategy(s3Config, s3Client);
          }

          default:
            throw new Error(`Unsupported storage type: ${storageType}`);
        }
      },
      inject: [ConfigService],
    };

    return {
      module: StorageModule,
      providers: [
        storageProvider,
        {
          provide: 'STORAGE_CONFIG',
          useValue: config,
        },
      ],
      exports: [STORAGE_STRATEGY_TOKEN],
    };
  }
}
