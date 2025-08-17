import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ScanStorageCommand } from '@modules/photo/commands/scan-storage/scan-storage.command';
import { Inject } from '@nestjs/common';
import { STORAGE_STRATEGY_TOKEN } from '@src/infrastructure/storage/storage.di-tokens';
import { StorageStrategyPort } from '@src/infrastructure/ports/storage-strategy.port';

@CommandHandler(ScanStorageCommand)
export class ScanStorageService implements ICommandHandler<ScanStorageCommand> {
  constructor(
    @Inject(STORAGE_STRATEGY_TOKEN)
    private readonly storageStrategy: StorageStrategyPort,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ScanStorageCommand): Promise<any> {
    for await (const file of this.storageStrategy.scan()) {
      if (file.isDirectory) {
        continue;
      }


    }
  }
}
