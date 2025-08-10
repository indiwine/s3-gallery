import { Paginated } from '../ddd';

export abstract class PaginatedResponseDto<T> extends Paginated<T> {
  abstract readonly data: readonly T[];
}
