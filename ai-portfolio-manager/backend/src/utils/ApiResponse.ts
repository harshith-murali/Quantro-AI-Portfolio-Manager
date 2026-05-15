/**
 * Standardised JSON response envelope for all API responses.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Build a success response envelope.
 */
export function successResponse<T>(message: string, data: T): ApiSuccessResponse<T> {
  return { success: true, message, data };
}

/**
 * Build an error response envelope.
 */
export function errorResponse(
  message: string,
  errors?: Record<string, string[]>,
): ApiErrorResponse {
  return { success: false, message, ...(errors && { errors }) };
}
