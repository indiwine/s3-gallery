import { ClsServiceManager } from 'nestjs-cls';

/**
 * Retrieves the current request ID from the context-local storage service.
 *
 * The `getRequestId` function accesses the CLS (Context-Local Storage) service
 * to fetch and return the unique identifier for the current request scope.
 * This is commonly used to correlate logs or operations associated with a specific request.
 *
 * @returns {string} The unique identifier for the current request.
 *
 * Please note: Only use this feature where absolutely necessary.ґ
 * Using this technique instead of dependency injection will make it difficult to mock the
 * ClsService and your code will become harder to test
 */
export const getRequestId = (): string => {
  const cls = ClsServiceManager.getClsService();
  return cls.getId();
};
