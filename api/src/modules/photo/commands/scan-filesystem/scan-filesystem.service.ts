import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ScanFilesystemCommand } from '@modules/photo/commands/scan-filesystem/scan-filesystem.command';

@CommandHandler(ScanFilesystemCommand)
export class ScanFilesystemService
  implements ICommandHandler<ScanFilesystemCommand>
{
  execute(command: ScanFilesystemCommand): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
