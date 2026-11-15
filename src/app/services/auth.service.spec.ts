import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let cartService: CartService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const emptyCartResponse = {
    success: true,
    status: 200,
    message: 'Carrito obtenido correctamente.',
    data: {
      id: 1,
      status: 'active',
      items_count: 0,
      subtotal: 0,
      total: 0,
      items: [],
    },
  };

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
        CartService,
        TokenStorageService,
      ],
    });

    service = TestBed.inject(AuthService);
    cartService = TestBed.inject(CartService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage failures
    }
  });

  it('should be created unauthenticated when no token is present', () => {
    expect(service).toBeTruthy();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should enforce min 8 password length locally before sending registration request', async () => {
    const result = await service.completeRegistration(
      {
        street: 'Calle 1',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'short',
      },
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('8 caracteres');
    httpMock.expectNone(`${apiUrl}/auth/register`);
  });

  it('should register user via POST /api/auth/register, persist token, clear draft, and sync cart', async () => {
    service.setRegistrationDraft({
      firstName: 'Tatiana',
      lastName: 'Ayala',
      email: 'tatiana@itca.edu.sv',
      password: 'secretpassword',
    });

    const regPromise = service.completeRegistration({
      street: 'Col. Miraflores, Bloque B, Casa #12',
      municipality: 'Santa Tecla',
      city: 'San Salvador',
      postalCode: '11101',
    });

    const regReq = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(regReq.request.method).toBe('POST');
    expect(regReq.request.body).toEqual({
      name: 'Tatiana Ayala',
      email: 'tatiana@itca.edu.sv',
      address: 'Col. Miraflores, Bloque B, Casa #12, Santa Tecla, San Salvador, 11101',
      password: 'secretpassword',
      password_confirmation: 'secretpassword',
      device_name: 'lifemedic-ionic',
    });

    regReq.flush({
      success: true,
      status: 201,
      message: 'Cuenta creada con éxito.',
      data: {
        token: 'sanctum-token-1',
        token_type: 'Bearer',
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          phone: null,
          address: 'Col. Miraflores, Bloque B, Casa #12, Santa Tecla, San Salvador, 11101',
          role: 'cliente',
          role_label: 'Cliente',
          is_active: true,
        },
      },
    });

    await Promise.resolve();
    const cartReq = httpMock.expectOne(`${apiUrl}/cart`);
    expect(cartReq.request.method).toBe('GET');
    expect(cartReq.request.headers.get('Authorization')).toBe('Bearer sanctum-token-1');
    cartReq.flush(emptyCartResponse);

    const result = await regPromise;
    expect(result.success).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getRegistrationDraft()).toBeNull();
    expect(tokenStorage.getToken()).toBe('sanctum-token-1');
    expect(service.getCurrentUser()?.address.street).toBe('Col. Miraflores, Bloque B, Casa #12');
    expect(service.getCurrentUser()?.address.postalCode).toBe('11101');
  });

  it('should reject login on 401 and authenticate on valid credentials while syncing guest cart', async () => {
    await cartService.addItem({
      id: 7,
      codigo: 'MED-00107',
      brand: 'BAYER',
      name: 'Paracetamol 500 mg',
      price: 5.0,
      currency: 'USD',
      image: 'assets/images/paracetamol.jpg',
      stock: 20,
    }, 2);

    const badLoginPromise = service.login('tatiana@itca.edu.sv', 'wrongpass');
    const badReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    badReq.flush(
      { success: false, message: 'Las credenciales proporcionadas son incorrectas.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const badResult = await badLoginPromise;
    expect(badResult.success).toBe(false);
    expect(badResult.message).toBe('Las credenciales proporcionadas son incorrectas.');
    expect(service.isLoggedIn()).toBe(false);

    const goodLoginPromise = service.login('tatiana@itca.edu.sv', 'mypassword1');
    const goodReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(goodReq.request.body).toEqual({
      email: 'tatiana@itca.edu.sv',
      password: 'mypassword1',
      device_name: 'lifemedic-ionic',
    });
    goodReq.flush({
      success: true,
      status: 200,
      message: 'Sesión iniciada correctamente.',
      data: {
        token: 'login-token-2',
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          phone: '7777-8888',
          address: 'Calle 123, Santa Tecla, Santa Tecla, 11090',
        },
      },
    });

    await Promise.resolve();
    const syncAddReq = httpMock.expectOne(`${apiUrl}/cart/items`);
    expect(syncAddReq.request.method).toBe('POST');
    expect(syncAddReq.request.body).toEqual({
      medicine_id: 7,
      codigo: 'MED-00107',
      quantity: 2,
    });
    syncAddReq.flush({ success: true, data: emptyCartResponse.data });

    await Promise.resolve();
    const getCartReq = httpMock.expectOne(`${apiUrl}/cart`);
    getCartReq.flush(emptyCartResponse);

    const goodResult = await goodLoginPromise;
    expect(goodResult.success).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUser()?.address.street).toBe('Calle 123');
    expect(service.getCurrentUser()?.phone).toBe('7777-8888');
  });

  it('should update delivery info, email, password, and profile data via PUT /api/auth/profile', async () => {
    const loginPromise = service.login('tatiana@itca.edu.sv', 'mypassword1');
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({
      success: true,
      data: {
        token: 'tok-profile',
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address: 'Calle 1, Santa Tecla, San Salvador, 11090',
        },
      },
    });
    await Promise.resolve();
    httpMock.expectOne(`${apiUrl}/cart`).flush(emptyCartResponse);
    await loginPromise;

    const deliveryPromise = service.updateDeliveryInfo({ phone: '+503 9988-7766' });
    const deliveryReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(deliveryReq.request.method).toBe('PUT');
    expect(deliveryReq.request.body.phone).toBe('+503 9988-7766');
    deliveryReq.flush({
      success: true,
      data: {
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          phone: '+503 9988-7766',
          address: 'Calle 1, Santa Tecla, San Salvador, 11090',
        },
      },
    });
    await deliveryPromise;
    expect(service.getCurrentUser()?.phone).toBe('+503 9988-7766');

    const emailPromise = service.updateEmail('nuevo@itca.edu.sv');
    const emailReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(emailReq.request.body).toEqual({ email: 'nuevo@itca.edu.sv' });
    emailReq.flush({
      success: true,
      data: {
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'nuevo@itca.edu.sv',
          phone: '+503 9988-7766',
          address: 'Calle 1, Santa Tecla, San Salvador, 11090',
        },
      },
    });
    const emailRes = await emailPromise;
    expect(emailRes.success).toBe(true);
    expect(service.getCurrentUser()?.email).toBe('nuevo@itca.edu.sv');

    const passPromise = service.updatePassword('newsecret99', 'newsecret99');
    const passReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(passReq.request.body).toEqual({
      password: 'newsecret99',
      password_confirmation: 'newsecret99',
    });
    passReq.flush({
      success: true,
      data: {
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'nuevo@itca.edu.sv',
          phone: '+503 9988-7766',
          address: 'Calle 1, Santa Tecla, San Salvador, 11090',
        },
      },
    });
    expect((await passPromise).success).toBe(true);

    const profilePromise = service.updateProfileData({
      firstName: 'XioFik',
      lastName: 'Hasan',
      street: 'Ej. Calle 123, Piso 4',
      municipality: 'San Miguelito',
      city: 'Panamá',
    });
    const profileReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(profileReq.request.body).toEqual({
      name: 'XioFik Hasan',
      address: 'Ej. Calle 123, Piso 4, San Miguelito, Panamá, 11090',
    });
    profileReq.flush({
      success: true,
      data: {
        user: {
          id: 12,
          name: 'XioFik Hasan',
          email: 'nuevo@itca.edu.sv',
          phone: '+503 9988-7766',
          address: 'Ej. Calle 123, Piso 4, San Miguelito, Panamá, 11090',
        },
      },
    });

    const profileRes = await profilePromise;
    expect(profileRes.success).toBe(true);
    expect(service.getCurrentUser()?.firstName).toBe('XioFik');
    expect(service.getCurrentUser()?.address.postalCode).toBe('11090');
  });

  it('should call POST /api/auth/logout with Bearer token and clear session & cart', async () => {
    const loginPromise = service.login('tatiana@itca.edu.sv', 'mypassword1');
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({
      success: true,
      data: {
        token: 'tok-logout',
        user: {
          id: 12,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address: null,
        },
      },
    });
    await Promise.resolve();
    httpMock.expectOne(`${apiUrl}/cart`).flush(emptyCartResponse);
    await loginPromise;

    const logoutPromise = service.logout();
    const logoutReq = httpMock.expectOne(`${apiUrl}/auth/logout`);
    expect(logoutReq.request.method).toBe('POST');
    expect(logoutReq.request.headers.get('Authorization')).toBe('Bearer tok-logout');
    logoutReq.flush({ success: true, data: null });

    await logoutPromise;
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getCurrentUser()).toBeNull();
    expect(tokenStorage.hasToken()).toBe(false);
    expect(cartService.getItems().length).toBe(0);
  });

  it('should report hasSessionToken(), deduplicate refreshProfile(), and recover user when session cache is missing', async () => {
    tokenStorage.setToken('tok-recover');
    expect(service.hasSessionToken()).toBe(true);
    expect(service.isLoggedIn()).toBe(false);

    const p1 = service.refreshProfile();
    const p2 = service.refreshProfile();

    const profileReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    profileReq.flush({
      success: true,
      data: {
        user: {
          id: 21,
          name: 'Ana López',
          email: 'ana@lifemedic.test',
          phone: '7777-0000',
          address: 'Calle Arce #10, San Salvador, San Salvador, 1101',
        },
      },
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUser()?.email).toBe('ana@lifemedic.test');
  });
});
