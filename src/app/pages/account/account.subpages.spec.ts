import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { AccountPageModule } from './account.module';
import { EditProfilePage } from './edit-profile/edit-profile.page';
import { ChangeEmailPage } from './change-email/change-email.page';
import { ChangePasswordPage } from './change-password/change-password.page';

describe('Account Subpages token hydration', () => {
  const apiUrl = environment.apiUrl;
  let httpMock: HttpTestingController;
  let router: Router;
  let tokenStorage: TokenStorageService;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  const mockProfileUser = {
    id: 14,
    name: 'Tatiana Ayala',
    email: 'tatiana@itca.edu.sv',
    address: 'Col. Miraflores, San Salvador, San Salvador, 11101',
    phone: '7777-8888',
  };

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      imports: [AccountPageModule, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        TokenStorageService,
        AuthService,
        CartService,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    tokenStorage = TestBed.inject(TokenStorageService);
    TestBed.inject(AuthService);
  }, 25000);

  afterEach(() => {
    httpMock.verify();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
  });

  describe('EditProfilePage', () => {
    it('should redirect to /account when no session token exists', () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const fixture = TestBed.createComponent(EditProfilePage);
      fixture.detectChanges();

      expect(navSpy).toHaveBeenCalledWith(['/account']);
    });

    it('should hydrate user profile via GET /api/auth/profile on token-only cold load', async () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      tokenStorage.setToken('subpage-token-1');

      const fixture: ComponentFixture<EditProfilePage> =
        TestBed.createComponent(EditProfilePage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const req = httpMock.expectOne(`${apiUrl}/auth/profile`);
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer subpage-token-1',
      );
      req.flush({
        success: true,
        data: { user: mockProfileUser },
      });

      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();

      expect(navSpy).not.toHaveBeenCalledWith(['/account']);
      expect(component.firstName).toBe('Tatiana');
      expect(component.lastName).toBe('Ayala');
      expect(component.street).toBe('Col. Miraflores');
      expect(component.municipality).toBe('San Salvador');
    });

    it('should redirect to /account when token-only profile refresh returns 401', async () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      tokenStorage.setToken('expired-token');

      const fixture = TestBed.createComponent(EditProfilePage);
      fixture.detectChanges();

      httpMock
        .expectOne(`${apiUrl}/auth/profile`)
        .flush(
          { success: false, message: 'Unauthenticated.' },
          { status: 401, statusText: 'Unauthorized' },
        );

      await new Promise((r) => setTimeout(r, 0));

      expect(tokenStorage.hasToken()).toBe(false);
      expect(navSpy).toHaveBeenCalledWith(['/account']);
    });
  });

  describe('ChangeEmailPage', () => {
    it('should redirect to /account when no session token exists', () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const fixture = TestBed.createComponent(ChangeEmailPage);
      fixture.detectChanges();

      expect(navSpy).toHaveBeenCalledWith(['/account']);
    });

    it('should hydrate email via GET /api/auth/profile on token-only cold load', async () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      tokenStorage.setToken('email-token-1');

      const fixture: ComponentFixture<ChangeEmailPage> =
        TestBed.createComponent(ChangeEmailPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      httpMock.expectOne(`${apiUrl}/auth/profile`).flush({
        success: true,
        data: { user: mockProfileUser },
      });

      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();

      expect(navSpy).not.toHaveBeenCalledWith(['/account']);
      expect(component.email).toBe('tatiana@itca.edu.sv');
    });
  });

  describe('ChangePasswordPage', () => {
    it('should redirect to /account when no session token exists', () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const fixture = TestBed.createComponent(ChangePasswordPage);
      fixture.detectChanges();

      expect(navSpy).toHaveBeenCalledWith(['/account']);
    });

    it('should allow access after refreshing profile on token-only cold load', async () => {
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      tokenStorage.setToken('pw-token-1');

      const fixture: ComponentFixture<ChangePasswordPage> =
        TestBed.createComponent(ChangePasswordPage);
      fixture.detectChanges();

      httpMock.expectOne(`${apiUrl}/auth/profile`).flush({
        success: true,
        data: { user: mockProfileUser },
      });

      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();

      expect(navSpy).not.toHaveBeenCalledWith(['/account']);
    });
  });
});
