import { Injectable } from '@nestjs/common';
import { walkStream } from '@nodelib/fs.walk';
import {
  FsScannerPort,
  FsScannerResult,
} from '@src/infrastructure/ports/fs-scanner.port';

@Injectable()
export class FileScannerAdapter implements FsScannerPort {
  async *scan(baseDir: string): AsyncGenerator<FsScannerResult> {
    const files = walkStream(baseDir, { stats: true });
    for await (const file of files) {
      yield file as FsScannerResult;
    }
  }
}
