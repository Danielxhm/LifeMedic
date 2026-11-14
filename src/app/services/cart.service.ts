import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../components/product-card/product-card.component';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  taxRate: number; // 0.15 = 15%
  shipping: number; // 0 = Envío gratis
  total: number;
  itemCount: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  subtotal: number;
}

export type PaymentMethodType = 'card' | 'cash_on_delivery';

export interface CheckoutShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderMetadata {
  shippingInfo?: CheckoutShippingInfo;
  paymentMethod?: PaymentMethodType;
  customerNotes?: string;
}

export interface OrderPayload {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  totalItems: number;
  status: 'pending' | 'submitted' | 'confirmed';
  createdAt: string;
  shippingInfo?: CheckoutShippingInfo;
  paymentMethod?: PaymentMethodType;
}

export interface CartActionResult {
  success: boolean;
  message: string;
  currentQuantity?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly defaultTaxRate = 0.103846; // Matches mockup: $13.50 tax on $130.00 subtotal -> $143.50

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([
    {
      product: {
        id: 7,
        brand: 'BAYER',
        laboratory: 'BAYER HEALTHCARE',
        name: 'Paracetamol 500 mg',
        price: 50.0,
        currency: 'USD',
        image: 'assets/images/paracetamol.jpg',
        stock: 12,
        sizes: ['50pcs', '100pcs'],
      },
      quantity: 1,
      selectedSize: '50pcs',
    },
    {
      product: {
        id: 1,
        brand: 'ADVIL',
        laboratory: 'SUIZOS ETICOS',
        name: 'Vitamina C 1000 mg',
        price: 32.0,
        originalPrice: 40.0,
        discountPercent: 20,
        currency: 'USD',
        image: 'assets/images/vitamina-c.png',
        stock: 8,
        sizes: ['30ml', '100ml'],
      },
      quantity: 1,
      selectedSize: '100ml',
    },
    {
      product: {
        id: 5,
        brand: 'MURAD',
        laboratory: 'NATURAL ESSENCE',
        name: 'Gengribre',
        price: 48.0,
        currency: 'USD',
        image: 'assets/images/ginger.jpg',
        stock: 6,
        sizes: ['Translucent', 'Concentrado'],
      },
      quantity: 1,
      selectedSize: 'Translucent',
    },
  ]);

  readonly items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

  readonly cartCount$: Observable<number> = this.items$.pipe(
    map((items) => items.reduce((sum, item) => sum + item.quantity, 0)),
  );

  readonly summary$: Observable<CartSummary> = this.items$.pipe(
    map((items) => this.calculateSummary(items)),
  );

  getItems(): CartItem[] {
    return this.itemsSubject.getValue();
  }

  getCartCount(): number {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  getSummary(): CartSummary {
    return this.calculateSummary(this.getItems());
  }

  /**
   * Adds product to cart or increments quantity, validating against stock.
   */
  addItem(
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
  ): CartActionResult {
    if (quantity <= 0) {
      return { success: false, message: 'La cantidad debe ser mayor a 0' };
    }

    const maxStock = product.stock ?? 10;
    const currentItems = [...this.itemsSubject.getValue()];
    const itemKey = this.getItemKey(product.id, selectedSize);
    const existingIndex = currentItems.findIndex(
      (item) => this.getItemKey(item.product.id, item.selectedSize) === itemKey,
    );

    const existingQty = existingIndex >= 0 ? currentItems[existingIndex].quantity : 0;
    const targetQty = existingQty + quantity;

    if (targetQty > maxStock) {
      const remaining = maxStock - existingQty;
      return {
        success: false,
        message:
          remaining > 0
            ? `Solo quedan ${remaining} unidad(es) disponible(s) en stock.`
            : `Has alcanzado el stock máximo (${maxStock} unidades) para este producto.`,
        currentQuantity: existingQty,
      };
    }

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: targetQty,
      };
    } else {
      currentItems.push({
        product: { ...product, stock: maxStock },
        quantity,
        selectedSize: selectedSize || (product.sizes?.length ? product.sizes[0] : undefined),
      });
    }

    this.itemsSubject.next(currentItems);
    return {
      success: true,
      message: `¡${product.name} agregado al carrito!`,
      currentQuantity: targetQty,
    };
  }

  /**
   * Updates the exact quantity of a cart item with stock boundary checks.
   */
  updateQuantity(
    productId: number,
    newQuantity: number,
    selectedSize?: string,
  ): CartActionResult {
    const currentItems = [...this.itemsSubject.getValue()];
    const itemKey = this.getItemKey(productId, selectedSize);
    const index = currentItems.findIndex(
      (item) => this.getItemKey(item.product.id, item.selectedSize) === itemKey,
    );

    if (index === -1) {
      return { success: false, message: 'Producto no encontrado en el carrito' };
    }

    const item = currentItems[index];
    const maxStock = item.product.stock ?? 10;

    if (newQuantity <= 0) {
      currentItems.splice(index, 1);
      this.itemsSubject.next(currentItems);
      return {
        success: true,
        message: `Se eliminó ${item.product.name} del carrito`,
        currentQuantity: 0,
      };
    }

    if (newQuantity > maxStock) {
      return {
        success: false,
        message: `Stock máximo disponible: ${maxStock} unidades.`,
        currentQuantity: item.quantity,
      };
    }

    currentItems[index] = {
      ...item,
      quantity: newQuantity,
    };

    this.itemsSubject.next(currentItems);
    return {
      success: true,
      message: 'Cantidad actualizada correctamente',
      currentQuantity: newQuantity,
    };
  }

  /**
   * Removes an item entirely from the cart.
   */
  removeItem(productId: number, selectedSize?: string): void {
    const currentItems = this.itemsSubject.getValue();
    const itemKey = this.getItemKey(productId, selectedSize);
    const updated = currentItems.filter(
      (item) => this.getItemKey(item.product.id, item.selectedSize) !== itemKey,
    );
    this.itemsSubject.next(updated);
  }

  /**
   * Clears all items in the cart.
   */
  clearCart(): void {
    this.itemsSubject.next([]);
  }

  /**
   * Prepares and dispatches order payload ready for backend server submission.
   */
  async submitOrder(
    metadataOrNotes?: string | OrderMetadata,
  ): Promise<OrderPayload> {
    const items = this.getItems();
    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const metadata: OrderMetadata =
      typeof metadataOrNotes === 'string'
        ? { customerNotes: metadataOrNotes }
        : (metadataOrNotes ?? {});

    const summary = this.getSummary();
    const orderItems: OrderItem[] = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      subtotal: parseFloat((item.product.price * item.quantity).toFixed(2)),
    }));

    const orderPayload: OrderPayload = {
      orderId: `LM-${Math.floor(100000 + Math.random() * 900000)}`,
      items: orderItems,
      subtotal: summary.subtotal,
      tax: summary.tax,
      taxRate: summary.taxRate,
      shipping: summary.shipping,
      total: summary.total,
      totalItems: summary.itemCount,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      shippingInfo: metadata.shippingInfo,
      paymentMethod: metadata.paymentMethod,
    };

    // Simulate server network call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Clear cart upon successful order submission
    this.clearCart();

    return orderPayload;
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotalRaw = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const subtotal = parseFloat(subtotalRaw.toFixed(2));
    const taxRaw = subtotal * this.defaultTaxRate;
    const tax = parseFloat(taxRaw.toFixed(2));
    const shipping = 0; // Envío gratis
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      tax,
      taxRate: this.defaultTaxRate,
      shipping,
      total,
      itemCount,
    };
  }

  private getItemKey(productId: number, size?: string): string {
    return `${productId}_${size || 'default'}`;
  }
}
