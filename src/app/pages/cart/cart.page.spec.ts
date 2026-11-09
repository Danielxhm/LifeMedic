import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  NavController,
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular/lazy';

import { CartPage } from './cart.page';
import { CartPageModule } from './cart.module';
import { CartService } from '../../services/cart.service';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let cartService: CartService;

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
    await TestBed.configureTestingModule({
      imports: [
        CartPageModule,
        RouterModule.forRoot([]),
      ],
      providers: [
        CartService,
        NavController,
        { provide: ToastController, useValue: mockToastCtrl },
        AlertController,
        { provide: LoadingController, useValue: mockLoadingCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  it('should create the cart page', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial items matching Figma mockup total $143.50 USD', () => {
    expect(component.items.length).toBe(3);
    expect(component.summary.subtotal).toBe(130.0);
    expect(component.summary.tax).toBe(13.5);
    expect(component.summary.total).toBe(143.5);
  });

  it('should increment item quantity and update totals when stock allows', () => {
    const initialQty = component.items[0].quantity;
    component.onIncrement(component.items[0]);
    fixture.detectChanges();

    expect(component.items[0].quantity).toBe(initialQty + 1);
    expect(component.summary.subtotal).toBeGreaterThan(130.0);
  });

  it('should prevent incrementing beyond stock limit and warn user', () => {
    const item = component.items[0];
    item.product.stock = 1;

    const toastSpy = vi.spyOn(component as any, 'showToast');
    component.onIncrement(item);

    expect(component.items[0].quantity).toBe(1);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stock máximo alcanzado'),
      'warning',
    );
  });

  it('should decrement quantity when greater than 1', () => {
    // First increment to 2
    component.onIncrement(component.items[0]);
    expect(component.items[0].quantity).toBe(2);

    // Then decrement back to 1
    component.onDecrement(component.items[0]);
    expect(component.items[0].quantity).toBe(1);
  });

  it('should trigger confirm removal when decrementing quantity 1', () => {
    const item = component.items[0];
    expect(item.quantity).toBe(1);
    const confirmSpy = vi.spyOn(component, 'confirmRemoveItem');
    component.onDecrement(item);

    expect(confirmSpy).toHaveBeenCalledWith(item);
  });

  it('should remove item directly with removeItem()', () => {
    const initialCount = component.items.length;
    const itemToRemove = component.items[0];
    component.removeItem(itemToRemove);
    fixture.detectChanges();

    expect(component.items.length).toBe(initialCount - 1);
  });

  it('should proceed to checkout, dispatch order to server, and open order modal', async () => {
    expect(component.isOrderModalOpen()).toBe(false);
    await component.proceedToCheckout();
    fixture.detectChanges();

    expect(component.confirmedOrder()).toBeTruthy();
    expect(component.confirmedOrder()?.orderId).toMatch(/^LM-/);
    expect(component.confirmedOrder()?.total).toBe(143.5);
    expect(component.isOrderModalOpen()).toBe(true);
  });

  it('should close order modal and reset state', () => {
    component.isOrderModalOpen.set(true);
    component.confirmedOrder.set({
      orderId: 'LM-123456',
      items: [],
      subtotal: 100,
      tax: 10.4,
      taxRate: 0.104,
      shipping: 0,
      total: 110.4,
      totalItems: 1,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    });

    component.closeOrderModal();
    expect(component.isOrderModalOpen()).toBe(false);
    expect(component.confirmedOrder()).toBeNull();
  });
});
