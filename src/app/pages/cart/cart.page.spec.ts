import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  NavController,
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { CartPage } from './cart.page';
import { CartPageModule } from './cart.module';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { TokenStorageService } from '../../services/token-storage.service';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let cartService: CartService;
  let authService: AuthService;
  let tokenStorage: TokenStorageService;
  let router: Router;
  let httpMock: HttpTestingController;

  const mockLoading = {
    present: vi.fn().mockResolvedValue(true),
    dismiss: vi.fn().mockResolvedValue(true),
  };

  const mockLoadingCtrl = {
    create: vi.fn().mockResolvedValue(mockLoading),
  };

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
      imports: [CartPageModule, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        TokenStorageService,
        CartService,
        AuthService,
        NavController,
        { provide: ToastController, useValue: mockToastCtrl },
        AlertController,
        { provide: LoadingController, useValue: mockLoadingCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    tokenStorage = TestBed.inject(TokenStorageService);
    cartService = TestBed.inject(CartService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);

    await cartService.addItem(
      {
        id: 7,
        brand: 'BAYER',
        name: 'Paracetamol 500 mg',
        price: 50.0,
        currency: 'USD',
        image: 'assets/images/paracetamol.jpg',
        stock: 12,
        sizes: ['50pcs'],
      },
      1,
      '50pcs',
    );
    await cartService.addItem(
      {
        id: 1,
        brand: 'ADVIL',
        name: 'Vitamina C 1000 mg',
        price: 80.0,
        currency: 'USD',
        image: 'assets/images/vitamina-c.png',
        stock: 8,
        sizes: ['100ml'],
      },
      1,
      '100ml',
    );

    fixture = TestBed.createComponent(CartPage);
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

  it('should create the cart page and show live cart totals', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(2);
    expect(component.summary.subtotal).toBe(130.0);
    expect(component.summary.tax).toBe(0);
    expect(component.summary.total).toBe(130.0);
  });

  it('should increment item quantity and update totals when stock allows', async () => {
    const initialQty = component.items[0].quantity;
    await component.onIncrement(component.items[0]);
    fixture.detectChanges();

    expect(component.items[0].quantity).toBe(initialQty + 1);
    expect(component.summary.subtotal).toBe(180.0);
  });

  it('should prevent incrementing beyond stock limit and warn user', async () => {
    const item = component.items[0];
    item.product.stock = 1;

    const toastSpy = vi.spyOn(component as any, 'showToast');
    await component.onIncrement(item);

    expect(component.items[0].quantity).toBe(1);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stock máximo alcanzado'),
      'warning',
    );
  });

  it('should decrement quantity when greater than 1', async () => {
    await component.onIncrement(component.items[0]);
    expect(component.items[0].quantity).toBe(2);

    await component.onDecrement(component.items[0]);
    expect(component.items[0].quantity).toBe(1);
  });

  it('should trigger confirm removal when decrementing quantity 1', async () => {
    const item = component.items[0];
    expect(item.quantity).toBe(1);
    const confirmSpy = vi
      .spyOn(component, 'confirmRemoveItem')
      .mockResolvedValue();
    await component.onDecrement(item);

    expect(confirmSpy).toHaveBeenCalledWith(item);
  });

  it('should remove item directly with removeItem()', async () => {
    const initialCount = component.items.length;
    const itemToRemove = component.items[0];
    await component.removeItem(itemToRemove);
    fixture.detectChanges();

    expect(component.items.length).toBe(initialCount - 1);
  });

  it('should redirect to login/welcome screen when unauthenticated on checkout', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(authService.isLoggedIn()).toBe(false);
    expect(component.items.length).toBeGreaterThan(0);

    await component.proceedToCheckout();

    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('should proceed directly to checkout page when user is authenticated', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
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

    const syncedServerCart = {
      id: 1,
      status: 'active',
      items_count: 2,
      subtotal: 130,
      total: 130,
      items: [
        {
          id: 101,
          medicine_id: 7,
          quantity: 1,
          unit_price: 50,
          line_total: 50,
          medicine: {
            id: 7,
            codigo: 'MED-007',
            name: 'Paracetamol 500 mg',
            brand: 'BAYER',
            price: 50,
            stock: 12,
            is_active: true,
            image_url: '/assets/images/paracetamol.jpg',
          },
        },
        {
          id: 102,
          medicine_id: 1,
          quantity: 1,
          unit_price: 80,
          line_total: 80,
          medicine: {
            id: 1,
            codigo: 'MED-001',
            name: 'Vitamina C 1000 mg',
            brand: 'ADVIL',
            price: 80,
            stock: 8,
            is_active: true,
            image_url: '/assets/images/vitamina-c.png',
          },
        },
      ],
    };

    httpMock.expectOne(`${environment.apiUrl}/auth/register`).flush({
      success: true,
      data: {
        token: 'cart-tok-1',
        user: {
          id: 1,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address:
            'Col. Miraflores, Bloque B, Casa #12, San Salvador, San Salvador, 11101',
        },
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    httpMock.expectOne(`${environment.apiUrl}/cart/items`).flush({
      success: true,
      data: syncedServerCart,
    });
    await new Promise((r) => setTimeout(r, 0));
    httpMock.expectOne(`${environment.apiUrl}/cart/items`).flush({
      success: true,
      data: syncedServerCart,
    });
    await new Promise((r) => setTimeout(r, 0));
    httpMock.expectOne(`${environment.apiUrl}/cart`).flush({
      success: true,
      data: syncedServerCart,
    });
    await regPromise;
    fixture.detectChanges();

    await component.proceedToCheckout();

    expect(navSpy).toHaveBeenCalledWith(['/checkout']);
  });

  it('should close order modal and reset state', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.isOrderModalOpen.set(true);
    component.confirmedOrder.set({
      orderId: 'LM-123456',
      items: [],
      subtotal: 100,
      tax: 0,
      taxRate: 0,
      shipping: 0,
      total: 100,
      totalItems: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    component.closeOrderModal();
    expect(component.isOrderModalOpen()).toBe(false);
    expect(component.confirmedOrder()).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/products']);
  });

  it('should refresh cart and profile on ionViewWillEnter when token exists without cached user', async () => {
    tokenStorage.setToken('cold-token-cart');
    expect(authService.isLoggedIn()).toBe(false);

    component.ionViewWillEnter();

    const cartReq = httpMock.expectOne(`${environment.apiUrl}/cart`);
    expect(cartReq.request.headers.get('Authorization')).toBe(
      'Bearer cold-token-cart',
    );
    cartReq.flush({
      success: true,
      data: {
        id: 1,
        status: 'active',
        items_count: 1,
        subtotal: 50,
        total: 50,
        items: [
          {
            id: 201,
            medicine_id: 7,
            quantity: 1,
            unit_price: 50,
            line_total: 50,
            medicine: {
              id: 7,
              codigo: 'MED-007',
              name: 'Paracetamol 500 mg',
              brand: 'BAYER',
              price: 50,
              stock: 12,
              is_active: true,
              image_url: '/assets/images/paracetamol.jpg',
            },
          },
        ],
      },
    });

    const profileReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
    profileReq.flush({
      success: true,
      data: {
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address: 'Col. Miraflores, San Salvador, San Salvador, 11101',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(authService.isLoggedIn()).toBe(true);
    expect(component.items.length).toBe(1);
  });

  it('should hydrate profile and navigate to /checkout on token-only proceedToCheckout()', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    tokenStorage.setToken('cold-checkout-token');
    expect(authService.isLoggedIn()).toBe(false);

    const checkoutPromise = component.proceedToCheckout();

    const profileReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
    expect(profileReq.request.headers.get('Authorization')).toBe(
      'Bearer cold-checkout-token',
    );
    profileReq.flush({
      success: true,
      data: {
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address: 'Col. Miraflores, San Salvador, San Salvador, 11101',
        },
      },
    });

    await checkoutPromise;

    expect(authService.isLoggedIn()).toBe(true);
    expect(navSpy).toHaveBeenCalledWith(['/checkout']);
  });

  it('should clear expired token and redirect to /auth/welcome on 401 during token-only proceedToCheckout()', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    tokenStorage.setToken('expired-checkout-token');

    const checkoutPromise = component.proceedToCheckout();

    httpMock
      .expectOne(`${environment.apiUrl}/auth/profile`)
      .flush(
        { success: false, message: 'Unauthenticated.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await checkoutPromise;

    expect(tokenStorage.hasToken()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith(['/auth/welcome'], {
      queryParams: { returnUrl: '/checkout' },
    });
  });

  it('should stay on cart and show danger toast when token-only proceedToCheckout() fails offline', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const toastSpy = vi.spyOn(component as any, 'showToast');
    tokenStorage.setToken('offline-checkout-token');

    const checkoutPromise = component.proceedToCheckout();

    httpMock
      .expectOne(`${environment.apiUrl}/auth/profile`)
      .error(new ProgressEvent('error'));

    await checkoutPromise;

    expect(tokenStorage.hasToken()).toBe(true);
    expect(navSpy).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo conectar con el servidor'),
      'danger',
    );
  });

  it('should handle stock === 0 by disabling increment button, showing stock warning, and preventing increment', async () => {
    const toastSpy = vi.spyOn(component as any, 'showToast');
    tokenStorage.setToken('stock-zero-token');

    component.ionViewWillEnter();
    httpMock.expectOne(`${environment.apiUrl}/cart`).flush({
      success: true,
      data: {
        id: 1,
        status: 'active',
        items_count: 1,
        subtotal: 50,
        total: 50,
        items: [
          {
            id: 301,
            medicine_id: 7,
            quantity: 1,
            unit_price: 50,
            line_total: 50,
            medicine: {
              id: 7,
              codigo: 'MED-007',
              name: 'Paracetamol 500 mg',
              brand: 'BAYER',
              price: 50,
              stock: 0,
              is_active: true,
              image_url: '/assets/images/paracetamol.jpg',
            },
          },
        ],
      },
    });
    httpMock.expectOne(`${environment.apiUrl}/auth/profile`).flush({
      success: true,
      data: {
        user: {
          id: 5,
          name: 'Tatiana Ayala',
          email: 'tatiana@itca.edu.sv',
          address: 'Col. Miraflores, San Salvador, San Salvador, 11101',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const plusButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.stepper__btn--plus',
    ) as HTMLButtonElement | null;
    expect(plusButton?.disabled).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).textContent,
    ).toContain('Producto sin stock disponible');

    await component.onIncrement(component.items[0]);
    expect(component.items[0].quantity).toBe(1);
    expect(toastSpy).toHaveBeenCalledWith(
      'Stock máximo alcanzado: este producto está agotado.',
      'warning',
    );
  });

  it('should show warning toast when authenticated removeItem API call fails', async () => {
    const toastSpy = vi.spyOn(component as any, 'showToast');
    tokenStorage.setToken('remove-fail-token');
    component.items[0].cartItemId = 999;

    const removePromise = component.removeItem(component.items[0]);
    httpMock
      .expectOne(`${environment.apiUrl}/cart/items/999`)
      .error(new ProgressEvent('error'));
    await removePromise;

    expect(component.items.length).toBe(2);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo conectar con el servidor'),
      'warning',
    );
  });

  it('should show danger toast when clearAll fails against backend API', async () => {
    const toastSpy = vi.spyOn(component as any, 'showToast');
    const alertCtrl = TestBed.inject(AlertController);
    let destructiveHandler: (() => Promise<void>) | undefined;
    vi.spyOn(alertCtrl, 'create').mockImplementation(async (opts: any) => {
      destructiveHandler = opts.buttons?.[1]?.handler;
      return { present: vi.fn().mockResolvedValue(true) } as any;
    });

    tokenStorage.setToken('clear-fail-token');
    component.items[0].cartItemId = 801;
    component.items[1].cartItemId = 802;

    await component.clearAll();
    expect(destructiveHandler).toBeDefined();

    const clearPromise = destructiveHandler!();
    httpMock
      .expectOne(`${environment.apiUrl}/cart/items/801`)
      .error(new ProgressEvent('error'));
    await new Promise((r) => setTimeout(r, 0));
    httpMock
      .expectOne(`${environment.apiUrl}/cart/items/802`)
      .flush({ success: true, data: { id: 1, status: 'active', items_count: 1, subtotal: 50, total: 50, items: [] } });
    await new Promise((r) => setTimeout(r, 0));
    httpMock
      .expectOne(`${environment.apiUrl}/cart`)
      .error(new ProgressEvent('error'));
    await clearPromise;

    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo conectar con el servidor'),
      'danger',
    );
  });
});
