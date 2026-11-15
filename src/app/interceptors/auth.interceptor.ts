import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');

  if (!isApiRequest) {
    return next(req);
  }

  const token = tokenStorage.getToken();
  const headers: Record<string, string> = {};

  if (!req.headers.has('Accept')) {
    headers['Accept'] = 'application/json';
  }

  let attachedToken = false;
  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
    attachedToken = true;
  }

  const authReq =
    Object.keys(headers).length > 0 ? req.clone({ setHeaders: headers }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        attachedToken &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        tokenStorage.notifyUnauthorized();
      }
      return throwError(() => error);
    }),
  );
};
