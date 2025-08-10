import { Command, CommandProps } from '@libs/ddd';

export class CreatePhotoCommand extends Command {
  readonly relativePath: string;
  readonly width: number;
  readonly height: number;
  readonly size: number;

  constructor(props: CommandProps<CreatePhotoCommand>) {
    super(props);
    this.relativePath = props.relativePath;
    this.width = props.width;
    this.height = props.height;
    this.size = props.size;
  }
}
