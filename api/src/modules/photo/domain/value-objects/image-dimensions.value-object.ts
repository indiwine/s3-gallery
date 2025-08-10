import { ValueObject, ValueObjectProps } from '@libs/ddd';
import { ArgumentOutOfRangeException } from '@libs/exceptions';

export interface ImageDimensionsProps {
  width: number;
  height: number;
}

export class ImageDimensions extends ValueObject<ImageDimensionsProps> {
  protected validate(props: ValueObjectProps<ImageDimensionsProps>): void {
    if (props.width < 0 || props.height < 0) {
      throw new ArgumentOutOfRangeException(
        `Image dimensions must be greater than 0.`,
      );
    }
  }

  /**
   * Calculates the dimensions of an image while maintaining the aspect ratio,
   * ensuring the larger dimension does not exceed the given maximum value.
   *
   * @param {number} highest - The maximum value for the largest dimension (either width or height) of the image.
   * @return {ImageDimensions} The adjusted dimensions of the image with the aspect ratio preserved.
   */
  calculateDimensionsFromHighest(highest: number): ImageDimensions {
    const { width: originalWidth, height: originalHeight } = this.props;
    // If both dimensions are already within the limit, return original
    if (this.props.width <= highest && this.props.height <= highest) {
      return new ImageDimensions({
        width: originalWidth,
        height: originalHeight,
      });
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      // Width is the highest dimension
      const width = highest;
      const height = Math.round(width / aspectRatio);
      return new ImageDimensions({ width, height });
    }

    // Height is the highest dimension
    const height = highest;
    const width = Math.round(height * aspectRatio);
    return new ImageDimensions({ width, height });
  }
}
