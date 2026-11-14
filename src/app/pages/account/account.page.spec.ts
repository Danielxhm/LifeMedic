import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular/lazy';

import { AccountPage } from './account.page';
import { AccountPageModule } from './account.module';
import { AuthService } from '../../services/auth.service';

describe('AccountPage', () => {
  let component: AccountPage;
  let fixture: ComponentFixture<AccountPage>;
  let authService: AuthService;
  let router: Router;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  const registerTestUser = () => {
    authService.completeRegistration(
      {
        street: 'Col. Miraflores, Bloque B, Casa #12',
        municipality: 'San Salvador',
        city: 'San Salvador',
        postalCode: '11101',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'password123',
      },
    );
  };

  const initPage = () => {
    fixture = TestBed.createComponent(AccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    (
      component as unknown as { ionViewWillEnter?: () => void }
    ).ionViewWillEnter?.();
    fixture.detectChanges();
  };

  const findButtonByText = (text: string): HTMLElement | undefined => {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    return buttons.find((btn) => btn.textContent?.includes(text));
  };

  const collectNavigatedTargets = (
    navigateSpy: ReturnType<typeof vi.spyOn>,
    navigateByUrlSpy: ReturnType<typeof vi.spyOn>,
  ): string => {
    const calls = [...navigateSpy.mock.calls, ...navigateByUrlSpy.mock.calls];
    return JSON.stringify(calls);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors in restricted environments
    }

    await TestBed.configureTestingModule({
      imports: [AccountPageModule, RouterModule.forRoot([])],
      providers: [
        AuthService,
        NavController,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  }, 25000);

  it('should render guest view when no user is authenticated and navigate to auth flows', () => {
    initPage();

    expect(component).toBeTruthy();
    expect(component.user).toBeNull();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Datos personales');
    expect(text).not.toContain('Soporte Técnico');

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const navByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    component.goToWelcome();
    expect(collectNavigatedTargets(navSpy, navByUrlSpy)).toContain(
      '/auth/welcome',
    );

    component.goToRegister();
    expect(collectNavigatedTargets(navSpy, navByUrlSpy)).toContain(
      '/auth/register',
    );
  });

  it('should render authenticated user profile details and menu groups', () => {
    registerTestUser();
    initPage();

    expect(component.user).toBeTruthy();
    expect(component.getInitials()).toBe('TA');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Perfil');
    expect(text).toContain('Tatiana Ayala');
    expect(text).toContain('tatiana@itca.edu.sv');
    expect(text).not.toContain('CareGiver');
    expect(text).toContain('Datos personales');
    expect(text).toContain('Cambiar correo');
    expect(text).toContain('Cambiar Contraseña');
    expect(text).toContain('Soporte Técnico');
    expect(text).toContain('Políticas de privacidad');
  });

  it('should navigate to edit-profile, change-email, and change-password sub-routes', () => {
    registerTestUser();
    initPage();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const navByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    findButtonByText('Datos personales')?.click();
    expect(collectNavigatedTargets(navSpy, navByUrlSpy)).toContain(
      '/account/edit-profile',
    );

    findButtonByText('Cambiar correo')?.click();
    expect(collectNavigatedTargets(navSpy, navByUrlSpy)).toContain(
      '/account/change-email',
    );

    findButtonByText('Cambiar Contraseña')?.click();
    expect(collectNavigatedTargets(navSpy, navByUrlSpy)).toContain(
      '/account/change-password',
    );
  });

  it('should keep Soporte Técnico and Políticas de privacidad as static buttons without redirecting', () => {
    registerTestUser();
    initPage();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const navByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    const soporteBtn = findButtonByText('Soporte Técnico');
    const privacidadBtn = findButtonByText('Políticas de privacidad');

    expect(soporteBtn).toBeTruthy();
    expect(privacidadBtn).toBeTruthy();

    soporteBtn?.click();
    privacidadBtn?.click();
    fixture.detectChanges();

    expect(navSpy).not.toHaveBeenCalled();
    expect(navByUrlSpy).not.toHaveBeenCalled();
  });

  it('should log out active user when logout is triggered', async () => {
    registerTestUser();
    initPage();
    expect(authService.getCurrentUser()).toBeTruthy();

    await Promise.resolve(component.logout());
    fixture.detectChanges();

    expect(authService.getCurrentUser()).toBeNull();
    expect(component.user).toBeNull();
  });
});
