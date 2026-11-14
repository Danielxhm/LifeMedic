import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular/lazy';

import { CheckoutPage } from './checkout.page';
import { CheckoutPageModule } from './checkout.module';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let authService: AuthService;
  let cartService: CartService;
  let router: Router;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }

    await TestBed.configureTestingModule({
      imports: [CheckoutPageModule, RouterModule.forRoot([])],
      providers: [
        AuthService,
        CartService,
        NavController,
        AlertController,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);

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

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  it('should create and prefill delivery address from registered user', () => {
    expect(component).toBeTruthy();
    expect(component.fullName).toBe('Tatiana Ayala');
    expect(component.address).toBe('Col. Miraflores, Bloque B, Casa #12');
    expect(component.city).toBe('San Salvador');
    expect(component.postalCode).toBe('11101');
  });

  it('should redirect to login/welcome screen if user is not authenticated', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authService.logout();
    component.ionViewWillEnter();

    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('should validate payment method and phone, then dispatch order and show confirmation modal', async () => {
    component.phone = '+503 9988-7766';
    component.selectPaymentMethod('card');

    expect(component.isOrderModalOpen()).toBe(false);
    await component.confirmAndPay();
    fixture.detectChanges();

    expect(component.confirmedOrder()).toBeTruthy();
    expect(component.confirmedOrder()?.orderId).toMatch(/^LM-/);
    expect(component.confirmedOrder()?.shippingInfo?.address).toBe(
      'Col. Miraflores, Bloque B, Casa #12',
    );
    expect(component.confirmedOrder()?.paymentMethod).toBe('card');
    expect(component.isOrderModalOpen()).toBe(true);
  });
});
