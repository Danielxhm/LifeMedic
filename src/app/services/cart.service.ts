import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../components/product-card/product-card.component';
import { TokenStorageService } from './token-storage.service';
import {
  ApiResponseEnvelope,
  extractApiErrorMessage,
} from '../utils/api-error.util';

export interface CartItem {
  cartItemId?: number;
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface OrderItem {
  productId: number;
  codigo?: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  subtotal: number;
  imageUrl?: string | null;
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
  deliveryMethod?: 'Domicilio' | 'Sucursal';
  shippingCost?: number;
  customerNotes?: string;
}

export interface OrderPayload {
  id?: number;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  totalItems: number;
  status: string;
  statusLabel?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  createdAt: string;
  shippingInfo?: CheckoutShippingInfo;
  paymentMethod?: PaymentMethodType;
}

export interface CartActionResult {
  success: boolean;
  message: string;
  currentQuantity?: number;
}

export interface ApiCartItemMedicine {
  id: number;
  codigo: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
}

export interface ApiCartItem {
  id: number;
  medicine_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  medicine: ApiCartItemMedicine | null;
}

export interface ApiCart {
  id: number;
  status: 'active' | 'checked_out';
  items_count: number;
  subtotal: number;
  total: number;
  items: ApiCartItem[];
}

export interface ApiOrderItem {
  id: number;
  medicine_id: number;
  codigo: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url: string | null;
}

export interface ApiOrder {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  delivery_method: string;
  delivery_method_label: string;
  delivery_address: string | null;
  free_shipping: boolean;
  shipping_cost: number;
  subtotal: number;
  total: number;
  customer_name: string;
  customer_email: string;
  phone: string | null;
  admin_note: string | null;
  placed_at: string | null;
  status_updated_at: string | null;
  items_count: number;
  items: ApiOrderItem[];
}

const GUEST_CART_STORAGE_KEY = 'lifemedic_guest_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiUrl = environment.apiUrl;
  private readonly backendUrl = this.apiUrl.replace(/\/api$/, '');

  private readonly defaultTaxRate = 0;
  private readonly productMetaByMedicineId = new Map<
    number,
    { product: Product; selectedSize?: string }
  >();

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(
    this.loadInitialGuestCart(),
  );
  private inFlightRefreshPromise: Promise<CartItem[]> | null = null;

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

  async refreshCart(): Promise<CartItem[]> {
    if (!this.tokenStorage.hasToken()) {
      const guestItems = this.loadGuestCart();
      this.itemsSubject.next(guestItems);
      return guestItems;
    }

    if (this.inFlightRefreshPromise) {
      return this.inFlightRefreshPromise;
    }

    this.inFlightRefreshPromise = (async () => {
      try {
        const response = await firstValueFrom(
          this.http.get<ApiResponseEnvelope<ApiCart>>(`${this.apiUrl}/cart`),
        );

        const mapped = this.mapApiCartToItems(response.data);
        this.itemsSubject.next(mapped);
        return mapped;
      } finally {
        this.inFlightRefreshPromise = null;
      }
    })();

    return this.inFlightRefreshPromise;
  }

  async syncAfterLogin(): Promise<void> {
    if (!this.tokenStorage.hasToken()) {
      return;
    }

    const guestItems = this.loadGuestCart();
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        this.rememberProductMeta(item.product, item.selectedSize);
        try {
          await firstValueFrom(
            this.http.post<ApiResponseEnvelope<ApiCart>>(
              `${this.apiUrl}/cart/items`,
              {
                medicine_id: item.product.id,
                ...(item.product.codigo ? { codigo: item.product.codigo } : {}),
                quantity: item.quantity,
              },
            ),
          );
        } catch {
          // Ignore individual stock/availability errors while syncing remaining items
        }
      }
      this.clearGuestCartStorage();
    }

    try {
      await this.refreshCart();
    } catch {
      // Keep current state if cart fetch transiently fails
    }
  }

  clearLocalStateOnLogout(): void {
    this.inFlightRefreshPromise = null;
    this.clearGuestCartStorage();
    this.productMetaByMedicineId.clear();
    this.itemsSubject.next([]);
  }

  async addItem(
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
  ): Promise<CartActionResult> {
    if (quantity <= 0) {
      return { success: false, message: 'La cantidad debe ser mayor a 0' };
    }

    const resolvedSize =
      selectedSize || (product.sizes?.length ? product.sizes[0] : undefined);
    this.rememberProductMeta(product, resolvedSize);

    const currentItems = [...this.itemsSubject.getValue()];
    const existingForStockCheck = this.tokenStorage.hasToken()
      ? currentItems.find((item) => item.product.id === product.id)
      : currentItems.find(
          (item) =>
            this.getItemKey(item.product.id, item.selectedSize) ===
            this.getItemKey(product.id, resolvedSize),
        );

    const maxStock = product.stock ?? existingForStockCheck?.product.stock;
    const existingQty = existingForStockCheck?.quantity ?? 0;

    if (maxStock !== undefined) {
      if (maxStock <= 0 || product.inStock === false) {
        return {
          success: false,
          message: 'Este producto no tiene stock disponible por el momento.',
          currentQuantity: existingQty,
        };
      }

      if (existingQty + quantity > maxStock) {
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
    }

    if (this.tokenStorage.hasToken()) {
      try {
        const response = await firstValueFrom(
          this.http.post<ApiResponseEnvelope<ApiCart>>(
            `${this.apiUrl}/cart/items`,
            {
              medicine_id: product.id,
              ...(product.codigo ? { codigo: product.codigo } : {}),
              quantity,
            },
          ),
        );

        const mapped = this.mapApiCartToItems(response.data, {
          product,
          selectedSize: resolvedSize,
        });
        this.itemsSubject.next(mapped);

        const updatedItem = mapped.find((item) => item.product.id === product.id);
        return {
          success: true,
          message: response.message || `¡${product.name} agregado al carrito!`,
          currentQuantity: updatedItem?.quantity ?? existingQty + quantity,
        };
      } catch (error) {
        return {
          success: false,
          message: extractApiErrorMessage(
            error,
            'No se pudo agregar el producto al carrito.',
          ),
          currentQuantity: existingQty,
        };
      }
    }

    // Guest cart fallback in localStorage until user logs in
    const fallbackMaxStock = maxStock ?? 10;
    const itemKey = this.getItemKey(product.id, resolvedSize);
    const existingIndex = currentItems.findIndex(
      (item) => this.getItemKey(item.product.id, item.selectedSize) === itemKey,
    );
    const targetQty = existingQty + quantity;

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: targetQty,
      };
    } else {
      currentItems.push({
        product: { ...product, stock: fallbackMaxStock },
        quantity,
        selectedSize: resolvedSize,
      });
    }

    this.itemsSubject.next(currentItems);
    this.saveGuestCart(currentItems);

    return {
      success: true,
      message: `¡${product.name} agregado al carrito!`,
      currentQuantity: targetQty,
    };
  }

  async updateQuantity(
    productId: number,
    newQuantity: number,
    selectedSize?: string,
  ): Promise<CartActionResult> {
    const currentItems = [...this.itemsSubject.getValue()];
    const index = this.findItemIndex(currentItems, productId, selectedSize);

    if (index === -1) {
      return { success: false, message: 'Producto no encontrado en el carrito' };
    }

    const item = currentItems[index];
    const maxStock = item.product.stock ?? 10;

    if (newQuantity > maxStock) {
      return {
        success: false,
        message: `Stock máximo disponible: ${maxStock} unidades.`,
        currentQuantity: item.quantity,
      };
    }

    if (this.tokenStorage.hasToken() && item.cartItemId) {
      try {
        const sanitizedQty = Math.max(0, newQuantity);
        const response = await firstValueFrom(
          this.http.patch<ApiResponseEnvelope<ApiCart>>(
            `${this.apiUrl}/cart/items/${item.cartItemId}`,
            { quantity: sanitizedQty },
          ),
        );

        const mapped = this.mapApiCartToItems(response.data);
        this.itemsSubject.next(mapped);

        return {
          success: true,
          message:
            response.message ||
            (sanitizedQty === 0
              ? `Se eliminó ${item.product.name} del carrito`
              : 'Cantidad actualizada correctamente'),
          currentQuantity: sanitizedQty,
        };
      } catch (error) {
        return {
          success: false,
          message: extractApiErrorMessage(
            error,
            'No se pudo actualizar la cantidad.',
          ),
          currentQuantity: item.quantity,
        };
      }
    }

    if (newQuantity <= 0) {
      currentItems.splice(index, 1);
      this.itemsSubject.next(currentItems);
      this.saveGuestCart(currentItems);
      return {
        success: true,
        message: `Se eliminó ${item.product.name} del carrito`,
        currentQuantity: 0,
      };
    }

    currentItems[index] = {
      ...item,
      quantity: newQuantity,
    };

    this.itemsSubject.next(currentItems);
    this.saveGuestCart(currentItems);
    return {
      success: true,
      message: 'Cantidad actualizada correctamente',
      currentQuantity: newQuantity,
    };
  }

  async removeItem(
    productId: number,
    selectedSize?: string,
  ): Promise<CartActionResult> {
    const currentItems = this.itemsSubject.getValue();
    const index = this.findItemIndex(currentItems, productId, selectedSize);

    if (index === -1) {
      return { success: false, message: 'Producto no encontrado en el carrito' };
    }

    const item = currentItems[index];

    if (this.tokenStorage.hasToken() && item.cartItemId) {
      try {
        const response = await firstValueFrom(
          this.http.delete<ApiResponseEnvelope<ApiCart>>(
            `${this.apiUrl}/cart/items/${item.cartItemId}`,
          ),
        );

        const mapped = this.mapApiCartToItems(response.data);
        this.itemsSubject.next(mapped);

        return {
          success: true,
          message:
            response.message || `Se eliminó "${item.product.name}" del carrito`,
          currentQuantity: 0,
        };
      } catch (error) {
        return {
          success: false,
          message: extractApiErrorMessage(
            error,
            'No se pudo eliminar el producto del carrito.',
          ),
        };
      }
    }

    const itemKey = this.getItemKey(productId, selectedSize);
    const updated = currentItems.filter(
      (entry) =>
        this.getItemKey(entry.product.id, entry.selectedSize) !== itemKey,
    );
    this.itemsSubject.next(updated);
    this.saveGuestCart(updated);

    return {
      success: true,
      message: `Se eliminó "${item.product.name}" del carrito`,
      currentQuantity: 0,
    };
  }

  async clearCart(): Promise<void> {
    if (this.tokenStorage.hasToken()) {
      const currentItems = [...this.itemsSubject.getValue()];
      let lastError: unknown = null;

      for (const item of currentItems) {
        if (item.cartItemId) {
          try {
            await firstValueFrom(
              this.http.delete<ApiResponseEnvelope<ApiCart>>(
                `${this.apiUrl}/cart/items/${item.cartItemId}`,
              ),
            );
          } catch (error) {
            lastError = error;
          }
        }
      }

      if (lastError) {
        await this.refreshCart().catch(() => undefined);
        throw new Error(
          extractApiErrorMessage(
            lastError,
            'No se pudieron eliminar todos los productos del carrito.',
          ),
        );
      }
    }

    this.clearGuestCartStorage();
    this.itemsSubject.next([]);
  }

  async submitOrder(
    metadataOrNotes?: string | OrderMetadata,
  ): Promise<OrderPayload> {
    let items = this.getItems();
    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    if (!this.tokenStorage.hasToken()) {
      throw new Error('Debes iniciar sesión para confirmar tu pedido.');
    }

    const metadata: OrderMetadata =
      typeof metadataOrNotes === 'string'
        ? { customerNotes: metadataOrNotes }
        : (metadataOrNotes ?? {});

    const deliveryAddress = this.buildDeliveryAddress(metadata.shippingInfo);

    // Ensure any locally queued items are registered in the active server cart
    // before calling POST /api/orders without explicit items, so Laravel marks
    // the active cart as checked_out and deletes cart_items cleanly.
    const unsyncedItems = items.filter((item) => !item.cartItemId);
    if (unsyncedItems.length > 0) {
      for (const item of unsyncedItems) {
        this.rememberProductMeta(item.product, item.selectedSize);
        try {
          const syncRes = await firstValueFrom(
            this.http.post<ApiResponseEnvelope<ApiCart>>(
              `${this.apiUrl}/cart/items`,
              {
                medicine_id: item.product.id,
                ...(item.product.codigo ? { codigo: item.product.codigo } : {}),
                quantity: item.quantity,
              },
            ),
          );
          const mapped = this.mapApiCartToItems(syncRes.data);
          this.itemsSubject.next(mapped);
          items = mapped;
        } catch (error) {
          throw new Error(
            extractApiErrorMessage(
              error,
              'No se pudo sincronizar tu carrito antes de confirmar el pedido.',
            ),
          );
        }
      }
      this.clearGuestCartStorage();
    }

    const payload: {
      delivery_method: 'Domicilio' | 'Sucursal';
      delivery_address?: string;
      shipping_cost: number;
    } = {
      delivery_method: metadata.deliveryMethod ?? 'Domicilio',
      shipping_cost: metadata.shippingCost ?? 0,
      ...(deliveryAddress ? { delivery_address: deliveryAddress } : {}),
    };

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponseEnvelope<ApiOrder>>(
          `${this.apiUrl}/orders`,
          payload,
        ),
      );

      this.clearGuestCartStorage();
      this.itemsSubject.next([]);

      return this.mapApiOrderToPayload(response.data, metadata, items);
    } catch (error) {
      throw new Error(
        extractApiErrorMessage(
          error,
          'No se pudo procesar tu pedido. Intenta nuevamente.',
        ),
      );
    }
  }

  async getOrders(status?: string): Promise<ApiOrder[]> {
    if (!this.tokenStorage.hasToken()) {
      return [];
    }

    let params = new HttpParams();
    if (status && status.trim()) {
      params = params.set('status', status.trim());
    }

    const response = await firstValueFrom(
      this.http.get<ApiResponseEnvelope<ApiOrder[]>>(`${this.apiUrl}/orders`, {
        params,
      }),
    );

    return response.data ?? [];
  }

  async getOrderById(orderId: number): Promise<ApiOrder> {
    const response = await firstValueFrom(
      this.http.get<ApiResponseEnvelope<ApiOrder>>(
        `${this.apiUrl}/orders/${orderId}`,
      ),
    );
    return response.data;
  }

  private mapApiCartToItems(
    cart: ApiCart | null | undefined,
    recent?: { product: Product; selectedSize?: string },
  ): CartItem[] {
    if (!cart || !Array.isArray(cart.items)) {
      return [];
    }

    if (recent) {
      this.rememberProductMeta(recent.product, recent.selectedSize);
    }

    const previousByMedicineId = new Map<number, CartItem>();
    for (const prev of this.itemsSubject.getValue()) {
      previousByMedicineId.set(prev.product.id, prev);
    }

    return cart.items.map((apiItem) => {
      const med = apiItem.medicine;
      const medId = med?.id ?? apiItem.medicine_id;
      const prev = previousByMedicineId.get(medId);
      const cachedMeta = this.productMetaByMedicineId.get(medId);
      const prevProduct = prev?.product ?? cachedMeta?.product;
      const stock = med?.stock ?? prevProduct?.stock ?? 0;
      const price = Number(med?.price ?? apiItem.unit_price);

      const resolvedImage =
        this.resolveImageUrl(med?.image_url) ||
        prevProduct?.image ||
        'assets/images/paracetamol.jpg';

      return {
        cartItemId: apiItem.id,
        quantity: apiItem.quantity,
        selectedSize: prev?.selectedSize ?? cachedMeta?.selectedSize,
        product: {
          id: medId,
          codigo: med?.codigo ?? prevProduct?.codigo,
          brand: med?.brand ?? prevProduct?.brand ?? 'LifeMedic',
          laboratory: prevProduct?.laboratory,
          name: med?.name ?? prevProduct?.name ?? `Producto #${medId}`,
          price,
          originalPrice: prevProduct?.originalPrice,
          discountPercent: prevProduct?.discountPercent,
          currency: 'USD',
          image: resolvedImage,
          stock,
          inStock:
            med !== null && med !== undefined
              ? Boolean(med.is_active) && stock > 0
              : stock > 0,
          sizes: prevProduct?.sizes,
          catalogType: prevProduct?.catalogType ?? 'medicine',
          category: prevProduct?.category,
          categoryId: prevProduct?.categoryId,
        },
      };
    });
  }

  private mapApiOrderToPayload(
    order: ApiOrder,
    metadata: OrderMetadata,
    previousItems: CartItem[] = [],
  ): OrderPayload {
    const mappedItems: OrderItem[] = (order.items ?? []).map((item) => {
      const matched = previousItems.find(
        (prev) => prev.product.id === item.medicine_id,
      );
      return {
        productId: item.medicine_id,
        codigo: item.codigo ?? undefined,
        name: item.name,
        brand: matched?.product.brand ?? 'LifeMedic',
        price: Number(item.unit_price),
        quantity: item.quantity,
        selectedSize: matched?.selectedSize,
        subtotal: Number(item.line_total),
        imageUrl: this.resolveImageUrl(item.image_url) ?? item.image_url,
      };
    });

    return {
      id: order.id,
      orderId: order.order_number,
      items: mappedItems,
      subtotal: Number(order.subtotal),
      tax: 0,
      taxRate: 0,
      shipping: Number(order.shipping_cost ?? 0),
      total: Number(order.total),
      totalItems: order.items_count ?? mappedItems.reduce((s, i) => s + i.quantity, 0),
      status: order.status,
      statusLabel: order.status_label,
      deliveryMethod: order.delivery_method_label,
      deliveryAddress: order.delivery_address ?? undefined,
      createdAt: order.placed_at ?? new Date().toISOString(),
      shippingInfo: metadata.shippingInfo,
      paymentMethod: metadata.paymentMethod,
    };
  }

  private buildDeliveryAddress(shipping?: CheckoutShippingInfo): string | undefined {
    if (!shipping) {
      return undefined;
    }

    const parts = [shipping.address, shipping.city, shipping.postalCode]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length > 0));

    return parts.length > 0 ? parts.join(', ').slice(0, 255) : undefined;
  }

  private resolveImageUrl(imagePath?: string | null): string | null {
    if (!imagePath) {
      return null;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('assets/')) {
      return imagePath;
    }

    return `${this.backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  private rememberProductMeta(product: Product, selectedSize?: string): void {
    this.productMetaByMedicineId.set(product.id, {
      product: { ...product },
      selectedSize,
    });
  }

  private findItemIndex(
    items: CartItem[],
    productId: number,
    selectedSize?: string,
  ): number {
    if (selectedSize !== undefined) {
      const exactKey = this.getItemKey(productId, selectedSize);
      const exactIdx = items.findIndex(
        (item) => this.getItemKey(item.product.id, item.selectedSize) === exactKey,
      );
      if (exactIdx !== -1) {
        return exactIdx;
      }
    }
    return items.findIndex((item) => item.product.id === productId);
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotalRaw = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const subtotal = parseFloat(subtotalRaw.toFixed(2));
    const taxRaw = subtotal * this.defaultTaxRate;
    const tax = parseFloat(taxRaw.toFixed(2));
    const shipping = 0;
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

  private loadInitialGuestCart(): CartItem[] {
    if (this.tokenStorage.hasToken()) {
      return [];
    }
    return this.loadGuestCart();
  }

  private loadGuestCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveGuestCart(items: CartItem[]): void {
    if (this.tokenStorage.hasToken()) {
      return;
    }

    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage access failures in private/test environments
    }
  }

  private clearGuestCartStorage(): void {
    try {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch {
      // Ignore storage access failures
    }
  }
}
