import { ValueObject, ValueObjectProps } from '@libs/ddd';
import { ArgumentInvalidException } from '@libs/exceptions';

/**
 * @deprecated
 */
export class StoragePath extends ValueObject<string> {
  protected validate(props: ValueObjectProps<string>): void {
    if (!props.value || props.value.trim().length === 0) {
      throw new ArgumentInvalidException('Storage path cannot be empty');
    }
  }

  get relativePath(): string {
    return this.props.value;
  }
}
