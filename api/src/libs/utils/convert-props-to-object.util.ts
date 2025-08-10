import { Entity } from '../ddd/entity.base';
import { ValueObject } from '../ddd/value-object.base';
import { ObjectLiteral } from '@libs/types';

function isEntity(obj: unknown): obj is Entity<unknown> {
  /**
   * 'instanceof Entity' causes error here for some reason.
   * Probably creates some circular dependency. This is a workaround
   * until I find a solution :)
   */
  return (
    Object.prototype.hasOwnProperty.call(obj, 'toObject') &&
    Object.prototype.hasOwnProperty.call(obj, 'id') &&
    ValueObject.isValueObject((obj as Entity<unknown>).id)
  );
}

/**
 * Converts a value to its plain representation
 * Handles ValueObjects, Entities, and primitive values
 * @param item The item to convert
 */
function convertToPlainObject(item: unknown): unknown {
  // Handle null and undefined
  if (item === null || item === undefined) {
    return item;
  }

  // Handle ValueObjects
  if (ValueObject.isValueObject(item)) {
    return item.unpack();
  }

  // Handle Entities
  if (isEntity(item)) {
    return item.toObject();
  }

  // Handle arrays
  if (Array.isArray(item)) {
    return item.map((element) => convertToPlainObject(element));
  }

  // Handle plain objects (but not arrays, dates, etc.)
  if (
    item !== null &&
    typeof item === 'object' &&
    item.constructor === Object
  ) {
    const result: Record<string, unknown> = {};
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        result[key] = convertToPlainObject(
          (item as Record<string, unknown>)[key],
        );
      }
    }
    return result;
  }

  // Handle other types (primitives, Dates, etc.)
  return item;
}

/**
 * Converts Entity/Value Objects props to a plain object.
 * Useful for testing and debugging.
 * @param props
 */
export function convertPropsToObject(props: unknown): ObjectLiteral {
  // Handle null or undefined case
  if (props === null || props === undefined) {
    return {};
  }

  // Handle primitive values
  if (typeof props !== 'object') {
    return { value: props };
  }

  // Create a deep clone of the props
  const propsCopy = structuredClone(props);

  // For non-objects, return as is
  if (!propsCopy || typeof propsCopy !== 'object') {
    return { value: propsCopy } as ObjectLiteral;
  }

  const result: ObjectLiteral = {};

  // Safe iteration over object properties
  for (const prop in propsCopy as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(propsCopy, prop)) {
      const value = (propsCopy as Record<string, unknown>)[prop];

      if (Array.isArray(value)) {
        // Handle arrays by mapping each item
        result[prop] = value.map((item) => convertToPlainObject(item));
      } else {
        // Handle other values
        result[prop] = convertToPlainObject(value);
      }
    }
  }

  return result;
}
