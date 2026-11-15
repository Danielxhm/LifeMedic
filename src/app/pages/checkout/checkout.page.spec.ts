import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';

import { environment } from '../../../environments/environment';
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
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

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
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      imports: [CheckoutPageModule, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
    httpMock = TestBed.inject(HttpTestingController);

    const regPromise = authService.completeRegistration(
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

    httpMock.expectOne(`${apiUrl}/auth/register`).flush({
      success: true,
      data: {
        token: 'checkout-tok',
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address:
            'Col. Miraflores, Bloque B, Casa #12, San Salvador, San Salvador, 11101',
        },
      },
    });
    await Promise.resolve();
    httpMock.expectOne(`${apiUrl}/cart`).flush({
      success: true,
      data: {
        id: 1,
        status: 'active',
        items_count: 1,
        subtotal: 25,
        total: 25,
        items: [
          {
            id: 71,
            medicine_id: 7,
            quantity: 1,
            unit_price: 25,
            line_total: 25,
            medicine: {
              id: 7,
              codigo: 'MED-00107',
              name: 'Paracetamol 500 mg',
              brand: 'BAYER',
              price: 25,
              stock: 10,
              is_active: true,
              image_url: '/assets/images/paracetamol.jpg',
            },
          },
        ],
      },
    });
    await regPromise;

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  afterEach(() => {
    httpMock.verify();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
  });

  it('should create and prefill delivery address from registered user', () => {
    expect(component).toBeTruthy();
    expect(component.fullName).toBe('Tatiana Ayala');
    expect(component.address).toBe('Col. Miraflores, Bloque B, Casa #12');
    expect(component.city).toBe('San Salvador');
    expect(component.postalCode).toBe('11101');
  });

  it('should redirect to login/welcome screen if user is not authenticated', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const logoutPromise = authService.logout();
    httpMock.expectOne(`${apiUrl}/auth/logout`).flush({ success: true, data: null });
    await logoutPromise;

    component.ionViewWillEnter();

    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('should validate payment method and phone, then dispatch order to POST /api/orders and show confirmation modal', async () => {
    component.phone = '+503 9988-7766';
    component.selectPaymentMethod('card');

    expect(component.isOrderModalOpen()).toBe(false);
    const payPromise = component.confirmAndPay();

    const profileReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(profileReq.request.method).toBe('PUT');
    expect(profileReq.request.body.phone).toBe('+503 9988-7766');
    profileReq.flush({
      success: true,
      data: {
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          phone: '+503 9988-7766',
          address:
            'Col. Miraflores, Bloque B, Casa #12, San Salvador, San Salvador, 11101',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    const orderReq = httpMock.expectOne(`${apiUrl}/orders`);
    expect(orderReq.request.method).toBe('POST');
    expect(orderReq.request.body).toEqual({
      delivery_method: 'Domicilio',
      shipping_cost: 0,
      delivery_address:
        'Col. Miraflores, Bloque B, Casa #12, San Salvador, 11101',
    });
    orderReq.flush({
      success: true,
      status: 201,
      message: 'Pedido registrado correctamente.',
      data: {
        id: 88,
        order_number: 'LM-2026-000088',
        status: 'pending',
        status_label: 'Pendiente',
        delivery_method: 'Domicilio',
        delivery_method_label: 'Envío a domicilio',
        delivery_address:
          'Col. Miraflores, Bloque B, Casa #12, San Salvador, 11101',
        free_shipping: true,
        shipping_cost: 0,
        subtotal: 25,
        total: 25,
        customer_name: 'Tatiana Ayala',
        customer_email: 'tatiana@itca.edu.sv',
        phone: '+503 9988-7766',
        admin_note: null,
        placed_at: '2026-11-15T04:00:00Z',
        status_updated_at: null,
        items_count: 1,
        items: [
          {
            id: 1,
            medicine_id: 7,
            codigo: 'MED-00107',
            name: 'Paracetamol 500 mg',
            quantity: 1,
            unit_price: 25,
            line_total: 25,
            image_url: '/assets/images/paracetamol.jpg',
          },
        ],
      },
    });

    await payPromise;
    fixture.detectChanges();

    expect(component.confirmedOrder()).toBeTruthy();
    expect(component.confirmedOrder()?.orderId).toBe('LM-2026-000088');
    expect(component.isOrderModalOpen()).toBe(true);
    expect(cartService.getCartCount()).toBe(0);
  });

  it('should surface backend error message in toast when POST /api/orders returns 422', async () => {
    component.phone = '+503 9988-7766';
    component.selectPaymentMethod('cash_on_delivery');
    const toastSpy = vi.spyOn(component as any, 'showToast');

    const payPromise = component.confirmAndPay();
    httpMock.expectOne(`${apiUrl}/auth/profile`).flush({
      success: true,
      data: {
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          phone: '+503 9988-7766',
          address:
            'Col. Miraflores, Bloque B, Casa #12, San Salvador, San Salvador, 11101',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    httpMock.expectOne(`${apiUrl}/orders`).flush(
      {
        success: false,
        message: 'Stock insuficiente para Paracetamol 500 mg.',
        errors: {
          items: ['Stock insuficiente para Paracetamol 500 mg.'],
        },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await payPromise;
    expect(component.isOrderModalOpen()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
    expect(toastSpy).toHaveBeenCalledWith(
      'Stock insuficiente para Paracetamol 500 mg.',
      'danger',
    );
  });

  it('should NOT duplicate municipality in PUT /api/auth/profile and should halt checkout if profile update fails with 422', async () => {
    const regPromise = authService.completeRegistration(
      {
        street: 'Calle La Mascota #12',
        municipality: 'Antiguo Cuscatlán',
        city: 'San Salvador',
        postalCode: '1101',
      },
      {
        firstName: 'Carlos',
        lastName: 'Mendoza',
        email: 'carlos@lifemedic.test',
        password: 'Password123!',
      },
    );
    const regReq = httpMock.expectOne(`${apiUrl}/auth/register`);
    regReq.flush({
      success: true,
      data: {
        token: 'tok-dup',
        user: {
          id: 9,
          name: 'Carlos Mendoza',
          email: 'carlos@lifemedic.test',
          phone: null,
          address: 'Calle La Mascota #12, Antiguo Cuscatlán, San Salvador, 1101',
        },
      },
    });
    await Promise.resolve();
    httpMock.expectOne(`${apiUrl}/cart`).flush({
      success: true,
      data: {
        id: 2,
        status: 'active',
        items_count: 1,
        subtotal: 25,
        total: 25,
        items: [
          {
            id: 90,
            medicine_id: 1,
            quantity: 1,
            unit_price: 25,
            line_total: 25,
            medicine: {
              id: 1,
              codigo: 'MED-00001',
              name: 'Vitamina C',
              brand: 'GNC',
              price: 25,
              stock: 5,
              is_active: true,
              image_url: null,
            },
          },
        ],
      },
    });
    await regPromise;

    const f2 = TestBed.createComponent(CheckoutPage);
    const c2 = f2.componentInstance;
    f2.detectChanges();
    expect(c2.address).toBe('Calle La Mascota #12, Antiguo Cuscatlán');

    c2.phone = '12345678901234567890123456789012345';
    c2.selectPaymentMethod('card');
    const toastSpy = vi.spyOn(c2 as any, 'showToast');

    const payPromise = c2.confirmAndPay();
    const profReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(profReq.request.body.address).toBe(
      'Calle La Mascota #12, Antiguo Cuscatlán, San Salvador, 1101',
    );
    profReq.flush(
      {
        success: false,
        message: 'Teléfono demasiado largo.',
        errors: { phone: ['El teléfono no debe exceder 30 caracteres.'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await payPromise;
    httpMock.expectNone(`${apiUrl}/orders`);
    expect(c2.isOrderModalOpen()).toBe(false);
    expect(c2.isSubmitting()).toBe(false);
    expect(toastSpy).toHaveBeenCalledWith(
      'El teléfono no debe exceder 30 caracteres.',
      'danger',
    );
  });
});
