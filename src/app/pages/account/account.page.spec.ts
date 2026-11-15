import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { AccountPage } from './account.page';
import { AccountPageModule } from './account.module';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

describe('AccountPage', () => {
  let component: AccountPage;
  let fixture: ComponentFixture<AccountPage>;
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  const registerTestUser = async () => {
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
        token: 'account-tok-1',
        user: {
          id: 9,
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
        items_count: 0,
        subtotal: 0,
        total: 0,
        items: [],
      },
    });

    await regPromise;
  };

  const initPage = () => {
    fixture = TestBed.createComponent(AccountPage);
    component = fixture.componentInstance;
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
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        CartService,
        NavController,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  }, 25000);

  afterEach(() => {
    httpMock.verify();
  });

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

  it('should render authenticated user profile details and menu groups', async () => {
    await registerTestUser();
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
    expect(text).toContain('Mis pedidos');
    expect(text).toContain('Soporte Técnico');
    expect(text).toContain('Políticas de privacidad');
  });

  it('should navigate to edit-profile, change-email, and change-password sub-routes', async () => {
    await registerTestUser();
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

  it('should keep Soporte Técnico and Políticas de privacidad as static buttons without redirecting', async () => {
    await registerTestUser();
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

  it('should open Mis pedidos modal and load order history from GET /api/orders', async () => {
    await registerTestUser();
    initPage();

    const openPromise = component.openOrdersModal();
    const ordersReq = httpMock.expectOne(`${apiUrl}/orders`);
    expect(ordersReq.request.method).toBe('GET');
    ordersReq.flush({
      success: true,
      data: [
        {
          id: 42,
          order_number: 'LM-2026-XYZ123',
          status: 'pending',
          status_label: 'Pendiente',
          delivery_method: 'Domicilio',
          delivery_method_label: 'Envío a domicilio',
          delivery_address: 'Col. Miraflores, San Salvador',
          free_shipping: true,
          shipping_cost: 0,
          subtotal: 32,
          total: 32,
          customer_name: 'Tatiana Ayala',
          customer_email: 'tatiana@itca.edu.sv',
          phone: null,
          admin_note: null,
          placed_at: '2026-11-15T04:00:00Z',
          status_updated_at: null,
          items_count: 2,
          items: [],
        },
      ],
    });

    await openPromise;
    fixture.detectChanges();

    expect(component.isOrdersModalOpen).toBe(true);
    expect(component.orders.length).toBe(1);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('LM-2026-XYZ123');
    expect(text).toContain('Pendiente');
  });

  it('should fetch and display full order detail when an order is selected from Mis pedidos', async () => {
    await registerTestUser();
    initPage();

    const listOrder = {
      id: 42,
      order_number: 'LM-2026-XYZ123',
      status: 'pending',
      status_label: 'Pendiente',
      delivery_method: 'Domicilio',
      delivery_method_label: 'Envío a domicilio',
      delivery_address: 'Col. Miraflores, San Salvador',
      free_shipping: true,
      shipping_cost: 0,
      subtotal: 32,
      total: 32,
      customer_name: 'Tatiana Ayala',
      customer_email: 'tatiana@itca.edu.sv',
      phone: null,
      admin_note: null,
      placed_at: '2026-11-15T04:00:00Z',
      status_updated_at: null,
      items_count: 2,
      items: [],
    };

    const openPromise = component.openOrdersModal();
    httpMock.expectOne(`${apiUrl}/orders`).flush({
      success: true,
      data: [listOrder],
    });
    await openPromise;
    fixture.detectChanges();

    const orderCard = (fixture.nativeElement as HTMLElement).querySelector(
      '.order-history-card',
    ) as HTMLButtonElement | null;
    expect(orderCard).toBeTruthy();
    orderCard?.click();

    const detailReq = httpMock.expectOne(`${apiUrl}/orders/42`);
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush({
      success: true,
      data: {
        ...listOrder,
        phone: '7777-8888',
        items: [
          {
            id: 901,
            medicine_id: 7,
            codigo: 'MED-007',
            name: 'Paracetamol 500 mg',
            quantity: 2,
            unit_price: 16,
            line_total: 32,
          },
        ],
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(component.isOrderDetailView).toBe(true);
    expect(component.selectedOrder?.id).toBe(42);
    const detailText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(detailText).toContain('Paracetamol 500 mg');
    expect(detailText).toContain('2 × $16.00 USD');
    expect(detailText).toContain('Envío a domicilio');
    expect(detailText).toContain('Col. Miraflores, San Salvador');
    expect(detailText).toContain('7777-8888');
    expect(detailText).toContain('Gratis');

    component.backToOrdersList();
    fixture.detectChanges();
    expect(component.isOrderDetailView).toBe(false);
    expect(component.selectedOrder).toBeNull();
  });

  it('should show orderDetailError and allow returning when GET /api/orders/:id fails', async () => {
    await registerTestUser();
    initPage();

    const listOrder = {
      id: 42,
      order_number: 'LM-2026-XYZ123',
      status: 'pending',
      status_label: 'Pendiente',
      delivery_method: 'Domicilio',
      delivery_method_label: 'Envío a domicilio',
      delivery_address: 'Col. Miraflores, San Salvador',
      free_shipping: true,
      shipping_cost: 0,
      subtotal: 32,
      total: 32,
      customer_name: 'Tatiana Ayala',
      customer_email: 'tatiana@itca.edu.sv',
      phone: null,
      admin_note: null,
      placed_at: '2026-11-15T04:00:00Z',
      status_updated_at: null,
      items_count: 1,
      items: [],
    };

    const openPromise = component.openOrdersModal();
    httpMock.expectOne(`${apiUrl}/orders`).flush({
      success: true,
      data: [listOrder],
    });
    await openPromise;
    fixture.detectChanges();

    const detailPromise = component.openOrderDetail(listOrder);
    httpMock
      .expectOne(`${apiUrl}/orders/42`)
      .flush(
        { success: false, message: 'Pedido no disponible' },
        { status: 404, statusText: 'Not Found' },
      );

    await detailPromise;
    fixture.detectChanges();

    expect(component.isOrderDetailView).toBe(true);
    expect(component.selectedOrder).toBeNull();
    expect(component.orderDetailError).toContain('Pedido no disponible');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Volver a mis pedidos');
  });

  it('should log out active user via POST /api/auth/logout when logout is triggered', async () => {
    await registerTestUser();
    initPage();
    expect(authService.getCurrentUser()).toBeTruthy();

    const logoutPromise = component.logout();
    httpMock.expectOne(`${apiUrl}/auth/logout`).flush({
      success: true,
      data: null,
    });
    await logoutPromise;
    fixture.detectChanges();

    expect(authService.getCurrentUser()).toBeNull();
    expect(component.user).toBeNull();
  });
});
