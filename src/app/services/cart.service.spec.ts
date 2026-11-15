import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { CartService } from './cart.service';
import { TokenStorageService } from './token-storage.service';
import { Product } from '../components/product-card/product-card.component';

describe('CartService', () => {
  let service: CartService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockProduct: Product = {
    id: 99,
    codigo: 'MED-00099',
    brand: 'TEST',
    name: 'Medicamento Test',
    price: 10.0,
    currency: 'USD',
    image: 'assets/images/aspirina.jpg',
    stock: 5,
    inStock: true,
    sizes: ['10ml', '20ml'],
  };

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
        CartService,
        TokenStorageService,
      ],
    });

    service = TestBed.inject(CartService);
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

  it('should be created and start empty when no guest items or auth token exist', () => {
    expect(service).toBeTruthy();
    expect(service.getItems().length).toBe(0);
    expect(service.getCartCount()).toBe(0);
    expect(service.getSummary().total).toBe(0);
  });

  it('should add product to guest cart and enforce stock limits', async () => {
    const res1 = await service.addItem(mockProduct, 2, '10ml');
    expect(res1.success).toBe(true);
    expect(service.getCartCount()).toBe(2);

    await service.addItem(mockProduct, 2, '10ml');
    const resOver = await service.addItem(mockProduct, 2, '10ml'); // 4 + 2 > 5
    expect(resOver.success).toBe(false);
    expect(resOver.message).toContain('Solo quedan 1 unidad(es)');
    expect(service.getCartCount()).toBe(4);
  });

  it('should update guest quantity, delete on 0, and compute subtotal/total matching backend model', async () => {
    await service.addItem(mockProduct, 3, '10ml');
    const summary = service.getSummary();
    expect(summary.subtotal).toBe(30.0);
    expect(summary.tax).toBe(0);
    expect(summary.total).toBe(30.0);

    const invalid = await service.updateQuantity(99, 6, '10ml');
    expect(invalid.success).toBe(false);
    expect(invalid.message).toContain('Stock máximo disponible: 5');

    const zero = await service.updateQuantity(99, 0, '10ml');
    expect(zero.success).toBe(true);
    expect(service.getItems().length).toBe(0);
  });

  it('should reject submitOrder when user is unauthenticated', async () => {
    await service.addItem(mockProduct, 1, '10ml');
    await expect(service.submitOrder('Nota')).rejects.toThrow(
      'Debes iniciar sesión para confirmar tu pedido.',
    );
  });

  it('should sync add, update, delete, and order checkout with Laravel API when authenticated', async () => {
    tokenStorage.setToken('cart-token-123');

    const addPromise = service.addItem(mockProduct, 2, '10ml');
    const addReq = httpMock.expectOne(`${apiUrl}/cart/items`);
    expect(addReq.request.method).toBe('POST');
    expect(addReq.request.body).toEqual({
      medicine_id: 99,
      codigo: 'MED-00099',
      quantity: 2,
    });
    addReq.flush({
      success: true,
      status: 201,
      message: 'Producto agregado al carrito.',
      data: {
        id: 10,
        status: 'active',
        items_count: 2,
        subtotal: 20,
        total: 20,
        items: [
          {
            id: 501,
            medicine_id: 99,
            quantity: 2,
            unit_price: 10,
            line_total: 20,
            medicine: {
              id: 99,
              codigo: 'MED-00099',
              name: 'Medicamento Test',
              brand: 'TEST',
              price: 10,
              stock: 5,
              is_active: true,
              image_url: '/assets/images/aspirina.jpg',
            },
          },
        ],
      },
    });

    const addResult = await addPromise;
    expect(addResult.success).toBe(true);
    expect(service.getItems()[0].cartItemId).toBe(501);
    expect(service.getItems()[0].selectedSize).toBe('10ml');

    const patchPromise = service.updateQuantity(99, 4, '10ml');
    const patchReq = httpMock.expectOne(`${apiUrl}/cart/items/501`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body).toEqual({ quantity: 4 });
    patchReq.flush({
      success: true,
      status: 200,
      message: 'Cantidad actualizada.',
      data: {
        id: 10,
        status: 'active',
        items_count: 4,
        subtotal: 40,
        total: 40,
        items: [
          {
            id: 501,
            medicine_id: 99,
            quantity: 4,
            unit_price: 10,
            line_total: 40,
            medicine: {
              id: 99,
              codigo: 'MED-00099',
              name: 'Medicamento Test',
              brand: 'TEST',
              price: 10,
              stock: 5,
              is_active: true,
              image_url: '/assets/images/aspirina.jpg',
            },
          },
        ],
      },
    });
    const patchRes = await patchPromise;
    expect(patchRes.success).toBe(true);
    expect(service.getCartCount()).toBe(4);

    const orderPromise = service.submitOrder({
      deliveryMethod: 'Domicilio',
      shippingCost: 0,
      shippingInfo: {
        fullName: 'Tatiana Ayala',
        phone: '+503 7777-8888',
        address: 'Col. Miraflores #12',
        city: 'San Salvador',
        postalCode: '11101',
      },
      paymentMethod: 'card',
    });

    const orderReq = httpMock.expectOne(`${apiUrl}/orders`);
    expect(orderReq.request.method).toBe('POST');
    expect(orderReq.request.body).toEqual({
      delivery_method: 'Domicilio',
      shipping_cost: 0,
      delivery_address: 'Col. Miraflores #12, San Salvador, 11101',
    });
    orderReq.flush({
      success: true,
      status: 201,
      message: 'Pedido registrado correctamente.',
      data: {
        id: 77,
        order_number: 'LM-2026-AB12CD',
        status: 'pending',
        status_label: 'Pendiente',
        delivery_method: 'Domicilio',
        delivery_method_label: 'Envío a domicilio',
        delivery_address: 'Col. Miraflores #12, San Salvador, 11101',
        free_shipping: true,
        shipping_cost: 0,
        subtotal: 40,
        total: 40,
        customer_name: 'Tatiana Ayala',
        customer_email: 'tatiana@itca.edu.sv',
        phone: '+503 7777-8888',
        admin_note: null,
        placed_at: '2026-11-15T04:00:00Z',
        status_updated_at: null,
        items_count: 4,
        items: [
          {
            id: 901,
            medicine_id: 99,
            codigo: 'MED-00099',
            name: 'Medicamento Test',
            quantity: 4,
            unit_price: 10,
            line_total: 40,
            image_url: '/assets/images/aspirina.jpg',
          },
        ],
      },
    });

    const order = await orderPromise;
    expect(order.orderId).toBe('LM-2026-AB12CD');
    expect(order.total).toBe(40);
    expect(order.items[0].brand).toBe('TEST');
    expect(service.getItems().length).toBe(0);
  });

  it('should delete item via DELETE /api/cart/items/{id} and fetch order history', async () => {
    tokenStorage.setToken('cart-token-456');

    const refreshPromise = service.refreshCart();
    httpMock.expectOne(`${apiUrl}/cart`).flush({
      success: true,
      data: {
        id: 11,
        status: 'active',
        items_count: 1,
        subtotal: 15,
        total: 15,
        items: [
          {
            id: 610,
            medicine_id: 5,
            quantity: 1,
            unit_price: 15,
            line_total: 15,
            medicine: {
              id: 5,
              codigo: 'MED-00005',
              name: 'Ibuprofeno 400mg',
              brand: 'GENFAR',
              price: 15,
              stock: 8,
              is_active: true,
              image_url: null,
            },
          },
        ],
      },
    });
    await refreshPromise;

    const delPromise = service.removeItem(5);
    const delReq = httpMock.expectOne(`${apiUrl}/cart/items/610`);
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({
      success: true,
      data: { id: 11, status: 'active', items_count: 0, subtotal: 0, total: 0, items: [] },
    });
    await delPromise;
    expect(service.getItems().length).toBe(0);

    const ordersPromise = service.getOrders('pending');
    const ordersReq = httpMock.expectOne(`${apiUrl}/orders?status=pending`);
    expect(ordersReq.request.method).toBe('GET');
    ordersReq.flush({ success: true, data: [{ id: 1, order_number: 'LM-1' }] });
    const orders = await ordersPromise;
    expect(orders.length).toBe(1);
    expect(orders[0].order_number).toBe('LM-1');
  });

  it('should sync unsynced items before POST /api/orders without sending items array, and throw on clearCart DELETE failure', async () => {
    await service.addItem(mockProduct, 1);
    tokenStorage.setToken('tok-cart-fix');

    const submitPromise = service.submitOrder({
      deliveryMethod: 'Domicilio',
      shippingCost: 0,
      shippingInfo: {
        fullName: 'Ana',
        phone: '7777-8888',
        address: 'Calle 1',
        city: 'San Salvador',
        postalCode: '1101',
      },
    });

    const syncItemReq = httpMock.expectOne(`${apiUrl}/cart/items`);
    expect(syncItemReq.request.method).toBe('POST');
    syncItemReq.flush({
      success: true,
      data: {
        id: 12,
        status: 'active',
        items_count: 1,
        subtotal: 15,
        total: 15,
        items: [
          {
            id: 777,
            medicine_id: 5,
            quantity: 1,
            unit_price: 15,
            line_total: 15,
            medicine: {
              id: 5,
              codigo: 'MED-00005',
              name: 'Ibuprofeno 400mg',
              brand: 'GENFAR',
              price: 15,
              stock: 8,
              is_active: true,
              image_url: null,
            },
          },
        ],
      },
    });

    await Promise.resolve();
    const orderReq = httpMock.expectOne(`${apiUrl}/orders`);
    expect(orderReq.request.body.items).toBeUndefined();
    orderReq.flush({
      success: true,
      data: {
        id: 50,
        order_number: 'LM-50',
        status: 'pending',
        status_label: 'Pendiente',
        delivery_method: 'Domicilio',
        delivery_address: 'Calle 1, San Salvador, 1101',
        subtotal: 15,
        shipping_cost: 0,
        total: 15,
        customer_name: 'Ana',
        customer_email: 'ana@test.com',
        phone: '7777-8888',
        admin_note: null,
        placed_at: '2026-11-15T00:00:00Z',
        status_updated_at: null,
        items_count: 1,
        items: [],
      },
    });
    const order = await submitPromise;
    expect(order.orderId).toBe('LM-50');

    // Now test clearCart error propagation + server refresh
    const addReqPromise = service.addItem(mockProduct, 1);
    httpMock.expectOne(`${apiUrl}/cart/items`).flush({
      success: true,
      data: {
        id: 12,
        status: 'active',
        items_count: 1,
        subtotal: 15,
        total: 15,
        items: [
          {
            id: 888,
            medicine_id: 5,
            quantity: 1,
            unit_price: 15,
            line_total: 15,
            medicine: {
              id: 5,
              codigo: 'MED-00005',
              name: 'Ibuprofeno 400mg',
              brand: 'GENFAR',
              price: 15,
              stock: 8,
              is_active: true,
              image_url: null,
            },
          },
        ],
      },
    });
    await addReqPromise;

    const clearPromise = service.clearCart();
    httpMock
      .expectOne(`${apiUrl}/cart/items/888`)
      .flush(
        { success: false, message: 'Error eliminando del servidor' },
        { status: 500, statusText: 'Server Error' },
      );
    await Promise.resolve();
    httpMock.expectOne(`${apiUrl}/cart`).flush({
      success: true,
      data: {
        id: 12,
        status: 'active',
        items_count: 1,
        subtotal: 15,
        total: 15,
        items: [
          {
            id: 888,
            medicine_id: 5,
            quantity: 1,
            unit_price: 15,
            line_total: 15,
            medicine: {
              id: 5,
              codigo: 'MED-00005',
              name: 'Ibuprofeno 400mg',
              brand: 'GENFAR',
              price: 15,
              stock: 8,
              is_active: true,
              image_url: null,
            },
          },
        ],
      },
    });

    await expect(clearPromise).rejects.toThrow(
      'Error eliminando del servidor',
    );
    expect(service.getItems().length).toBe(1);
  });
});
