import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular/lazy';

import { AuthPageModule } from './auth.module';
import { AuthService } from '../../services/auth.service';
import { WelcomePage } from './welcome/welcome.page';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { AddressPage } from './address/address.page';

describe('Auth navigation back buttons', () => {
  let router: Router;
  let navCtrl: NavController;
  let authService: AuthService;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      imports: [AuthPageModule, RouterModule.forRoot([])],
      providers: [
        AuthService,
        NavController,
        AlertController,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    navCtrl = TestBed.inject(NavController);
    authService = TestBed.inject(AuthService);
  }, 25000);

  it('WelcomePage.goBack should navigate directly to /home instead of popping back into auth forms', () => {
    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();

    const rootSpy = vi
      .spyOn(navCtrl, 'navigateRoot')
      .mockResolvedValue(true);
    const backSpy = vi.spyOn(navCtrl, 'back');

    fixture.componentInstance.goBack();

    expect(rootSpy).toHaveBeenCalledWith('/home');
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('LoginPage.goBack should replace current route with /auth/welcome', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();

    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/home' },
      replaceUrl: true,
    });
  });

  it('RegisterPage.goBack should replace current route with /auth/welcome', () => {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();

    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/home' },
      replaceUrl: true,
    });
  });

  it('AddressPage.goBack should replace current route with /auth/register', () => {
    authService.setRegistrationDraft({
      firstName: 'Tatiana',
      lastName: 'Ayala',
      email: 'tatiana@itca.edu.sv',
      password: 'password123',
    });

    const fixture = TestBed.createComponent(AddressPage);
    fixture.detectChanges();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();

    expect(navSpy).toHaveBeenCalledWith(['/auth/register'], {
      queryParams: { returnUrl: '/home' },
      replaceUrl: true,
    });
  });
});
