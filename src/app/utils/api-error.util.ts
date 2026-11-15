import { HttpErrorResponse } from '@angular/common/http';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté en ejecución.';
    }

    const payload = error.error as
      | {
          message?: unknown;
          errors?: Record<string, unknown>;
        }
      | string
      | null
      | undefined;

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload.trim();
    }

    if (payload && typeof payload === 'object') {
      if (payload.errors && typeof payload.errors === 'object') {
        for (const value of Object.values(payload.errors)) {
          if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
            return value[0].trim();
          }
          if (typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }

      if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message.trim();
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return fallback;
}
