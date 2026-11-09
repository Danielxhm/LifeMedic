import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from '../components/product-card/product-card.component';

describe('CartService', () => {
  let service: CartService;

  const mockProduct: Product = {
    id: 99,
    brand: 'TEST',
    name: 'Medicamento Test',
    price: 10.0,
    currency: 'USD',
    image: 'assets/images/aspirina.jpg',
    stock: 5,
    sizes: ['10ml', '20ml'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clearCart();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start empty after clearCart()', () => {
    expect(service.getItems().length).toBe(0);
    expect(service.getCartCount()).toBe(0);
    expect(service.getSummary().total).toBe(0);
  });

  it('should add product to cart and update counts', () => {
    const result = service.addItem(mockProduct, 2, '10ml');
    expect(result.success).toBe(true);
    expect(service.getCartCount()).toBe(2);
    expect(service.getItems().length).toBe(1);
    expect(service.getItems()[0].quantity).toBe(2);
  });

  it('should validate against available stock on adding', () => {
    // mockProduct has stock: 5
    service.addItem(mockProduct, 4, '10ml');
    const result = service.addItem(mockProduct, 2, '10ml'); // 4 + 2 = 6 > 5
    expect(result.success).toBe(false);
    expect(result.message).toContain('Solo quedan 1 unidad(es)');
    expect(service.getCartCount()).toBe(4);
  });

  it('should update quantity and enforce stock limits', () => {
    service.addItem(mockProduct, 2, '10ml');

    // valid increment
    const updateValid = service.updateQuantity(99, 4, '10ml');
    expect(updateValid.success).toBe(true);
    expect(service.getCartCount()).toBe(4);

    // invalid increment exceeding stock of 5
    const updateInvalid = service.updateQuantity(99, 6, '10ml');
    expect(updateInvalid.success).toBe(false);
    expect(updateInvalid.message).toContain('Stock máximo disponible: 5');

    // decrease to 0 removes item
    const updateZero = service.updateQuantity(99, 0, '10ml');
    expect(updateZero.success).toBe(true);
    expect(service.getItems().length).toBe(0);
  });

  it('should remove item from cart', () => {
    service.addItem(mockProduct, 2, '10ml');
    service.removeItem(99, '10ml');
    expect(service.getItems().length).toBe(0);
    expect(service.getCartCount()).toBe(0);
  });

  it('should accurately calculate subtotal, tax, and total', () => {
    service.addItem(mockProduct, 3, '10ml'); // 3 * 10 = 30.00
    const summary = service.getSummary();
    expect(summary.subtotal).toBe(30.0);
    expect(summary.tax).toBeCloseTo(30.0 * summary.taxRate, 2);
    expect(summary.total).toBeCloseTo(summary.subtotal + summary.tax, 2);
  });

  it('should prepare and submit order payload to server and clear cart', async () => {
    service.addItem(mockProduct, 2, '10ml');
    const order = await service.submitOrder('Entregar en recepción');

    expect(order).toBeDefined();
    expect(order.orderId).toMatch(/^LM-\d{6}$/);
    expect(order.items.length).toBe(1);
    expect(order.items[0].productId).toBe(99);
    expect(order.items[0].quantity).toBe(2);
    expect(order.status).toBe('confirmed');
    expect(service.getItems().length).toBe(0);
  });
});
