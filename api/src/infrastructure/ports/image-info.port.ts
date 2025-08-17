export interface ImageInfoPort {
  /**
   * Return oriented dimensions of an image at given file path.
   * Must account for EXIF orientation.
   */
  getDimensions(filePath: string): Promise<{ width: number; height: number }>;
}
