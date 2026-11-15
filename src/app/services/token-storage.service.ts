import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export const AUTH_TOKEN_STORAGE_KEY = 'lifemedic_auth_token';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private memoryToken: string | null = null;
  private readonly unauthorizedSubject = new Subject<void>();

  readonly unauthorized$: Observable<void> =
    this.unauthorizedSubject.asObservable();

  getToken(): string | null {
    try {
      const stored = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (stored !== null) {
        this.memoryToken = stored;
        return stored;
      }
      return this.memoryToken;
    } catch {
      return this.memoryToken;
    }
  }

  setToken(token: string): void {
    const cleanToken = token.trim();
    this.memoryToken = cleanToken || null;

    try {
      if (this.memoryToken) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, this.memoryToken);
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage access failures in private/test environments
    }
  }

  clearToken(): void {
    this.memoryToken = null;
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage access failures in private/test environments
    }
  }

  hasToken(): boolean {
    const token = this.getToken();
    return typeof token === 'string' && token.length > 0;
  }

  notifyUnauthorized(): void {
    this.clearToken();
    this.unauthorizedSubject.next();
  }
}
