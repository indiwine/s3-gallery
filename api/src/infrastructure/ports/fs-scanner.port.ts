import { Entry } from '@nodelib/fs.scandir/out/types';

export interface FsScannerResult extends Entry {
  width: number;
  height: number;
}

export interface FsScannerPort {
  scan(baseDir: string): AsyncGenerator<FsScannerResult>;
}
