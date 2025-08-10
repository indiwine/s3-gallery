import { RequireAtLeastOne } from '@libs/types';

/**
 * Defines the interface for an image thumbnail configuration
 *
 * Specify one of the dimensions or both or the highest dimension,
 * depending on your needs
 */
export interface ImageThumbnailDefinitionInterface {
  width?: number | null;
  height?: number | null;
  highest?: number | null;
}

export type ImageThumbnailDefinition =
  RequireAtLeastOne<ImageThumbnailDefinitionInterface>;
