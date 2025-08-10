import { Module } from '@nestjs/common';
import { FileScannerAdapter } from './file-scanner.adapter';
import { FILE_SCANNER } from '@src/infrastructure/file-scanner/file-scanner.di-tokens';

@Module({
  providers: [
    {
      provide: FILE_SCANNER,
      useClass: FileScannerAdapter,
    },
  ],
  exports: [FILE_SCANNER],
})
export class FileScannerModule {}
