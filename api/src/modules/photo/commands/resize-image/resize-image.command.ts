import { Command, CommandProps } from '@libs/ddd';

export class ResizeImageCommand extends Command {
  public readonly photoId: string;
  public readonly tempFilePath: string;
  public readonly updateExifData: boolean = true;
  constructor(props: CommandProps<ResizeImageCommand>) {
    super(props);
    this.photoId = props.photoId;
    this.tempFilePath = props.tempFilePath;
    this.updateExifData = props.updateExifData;
  }
}
