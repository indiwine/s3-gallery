export interface StorageFileInfoInterface {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  width?: number;
  height?: number;
}
