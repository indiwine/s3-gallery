import { ValueObject } from '@libs/ddd';
import { ArgumentInvalidException } from '@src/libs/exceptions';

export interface ExifDataProps {
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  iso?: number;
  shutterSpeed?: string;
  dateTaken?: Date;
  flash?: boolean;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any;
}

export class ExifData extends ValueObject<ExifDataProps> {
  protected validate(props: ExifDataProps): void {
    if (props.gpsLocation) {
      if (Math.abs(props.gpsLocation.latitude) > 90) {
        throw new ArgumentInvalidException('Invalid GPS latitude');
      }
      if (Math.abs(props.gpsLocation.longitude) > 180) {
        throw new ArgumentInvalidException('Invalid GPS longitude');
      }
    }
  }

  get hasGpsData(): boolean {
    return !!this.props.gpsLocation;
  }

  get cameraInfo(): string {
    return `${this.props.camera || 'Unknown'} ${this.props.lens || ''}`.trim();
  }
}