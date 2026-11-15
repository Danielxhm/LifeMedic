import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage failures
    }

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Accept and Authorization Bearer headers to API requests when token exists', async () => {
    tokenStorage.setToken('token-abc-123');

    const promise = firstValueFrom(http.get(`${environment.apiUrl}/cart`));
    const req = httpMock.expectOne(`${environment.apiUrl}/cart`);

    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-abc-123');

    req.flush({ success: true, data: {} });
    await promise;
  });

  it('does not attach Bearer token to external URLs', async () => {
    tokenStorage.setToken('token-abc-123');

    const promise = firstValueFrom(http.get('https://example.com/public.json'));
    const req = httpMock.expectOne('https://example.com/public.json');

    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
    await promise;
  });

  it('clears token and notifies unauthorized$ when an authenticated endpoint returns 401', async () => {
    tokenStorage.setToken('expired-token');
    let unauthorizedTriggered = false;
    const sub = tokenStorage.unauthorized$.subscribe(() => {
      unauthorizedTriggered = true;
    });

    const promise = firstValueFrom(
      http.get(`${environment.apiUrl}/auth/profile`),
    ).catch((err) => err);

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
    req.flush(
      { success: false, message: 'No autenticado.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await promise;
    expect(tokenStorage.hasToken()).toBe(false);
    expect(unauthorizedTriggered).toBe(true);
    sub.unsubscribe();
  });

  it('does not fire unauthorized cleanup when /auth/login returns 401', async () => {
    let unauthorizedTriggered = false;
    const sub = tokenStorage.unauthorized$.subscribe(() => {
      unauthorizedTriggered = true;
    });

    const promise = firstValueFrom(
      http.post(`${environment.apiUrl}/auth/login`, {
        email: 'x@test.com',
        password: 'wrong',
      }),
    ).catch((err) => err);

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(
      { success: false, message: 'Credenciales incorrectas' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await promise;
    expect(unauthorizedTriggered).toBe(false);
    sub.unsubscribe();
  });
});
