import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  NavController,
  ToastController,
  AlertController,
} from '@ionic/angular/lazy';
import {
  ArrowLeft02Icon,
  Cancel01Icon,
  Add01Icon,
  Remove01Icon,
  ShoppingBag01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { AuthService } from '../../services/auth.service';
import {
  CartService,
  CartItem,
  CartSummary,
  OrderPayload,
} from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false,
})
export class CartPage implements OnInit {
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Cancel01Icon = Cancel01Icon;
  readonly Add01Icon = Add01Icon;
  readonly Remove01Icon = Remove01Icon;
  readonly ShoppingBag01Icon = ShoppingBag01Icon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly Delete02Icon = Delete02Icon;

  items: CartItem[] = [];
  previousItems: CartItem[] = [];
  summary: CartSummary = {
    subtotal: 0,
    tax: 0,
    taxRate: 0.103846,
    shipping: 0,
    total: 0,
    itemCount: 0,
  };
  previousSummary: CartSummary = {
    subtotal: 0,
    tax: 0,
    taxRate: 0.103846,
    shipping: 0,
    total: 0,
    itemCount: 0,
  };

  readonly isSubmitting = signal(false);
  readonly confirmedOrder = signal<OrderPayload | null>(null);
  readonly isOrderModalOpen = signal(false);

  formatPrice(amount: number | undefined): string {
    return `$${(amount ?? 0).toFixed(2)}`;
  }

  ngOnInit(): void {
    this.cartService.items$.subscribe((items) => {
      if (items.length > 0) {
        this.previousItems = [...items];
      }
      this.items = items;
      this.cdr.markForCheck();
    });

    this.cartService.summary$.subscribe((summary) => {
      if (summary.itemCount > 0) {
        this.previousSummary = { ...summary };
      }
      this.summary = summary;
      this.cdr.markForCheck();
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
    } else {
      this.router.navigate(['/products']);
    }
  }

  goToCatalog(): void {
    this.router.navigate(['/products']);
  }

  onIncrement(item: CartItem): void {
    const nextQty = item.quantity + 1;
    const maxStock = item.product.stock ?? 10;

    if (nextQty > maxStock) {
      this.showToast(
        `Stock máximo alcanzado: solo quedan ${maxStock} unidades disponibles.`,
        'warning',
      );
      return;
    }

    const result = this.cartService.updateQuantity(
      item.product.id,
      nextQty,
      item.selectedSize,
    );
    if (!result.success) {
      this.showToast(result.message, 'warning');
    }
    this.cdr.markForCheck();
  }

  onDecrement(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(
        item.product.id,
        item.quantity - 1,
        item.selectedSize,
      );
      this.cdr.markForCheck();
    } else {
      this.confirmRemoveItem(item);
    }
  }

  async confirmRemoveItem(item: CartItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Deseas eliminar "${item.product.name}" del carrito?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.removeItem(item);
          },
        },
      ],
    });
    await alert.present();
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.product.id, item.selectedSize);
    this.showToast(`Se eliminó "${item.product.name}" del carrito`, 'dark');
    this.cdr.markForCheck();
  }

  async clearAll(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Vaciar carrito',
      message: '¿Estás seguro de que deseas eliminar todos los productos?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Vaciar',
          role: 'destructive',
          handler: () => {
            this.cartService.clearCart();
            this.showToast('Carrito vaciado', 'dark');
            this.cdr.markForCheck();
          },
        },
      ],
    });
    await alert.present();
  }

  async proceedToCheckout(): Promise<void> {
    if (this.items.length === 0 || this.isSubmitting()) return;

    if (!this.authService.isLoggedIn()) {
      await this.router.navigate(['/auth/welcome'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    await this.router.navigate(['/checkout']);
  }

  closeOrderModal(): void {
    this.isOrderModalOpen.set(false);
    this.confirmedOrder.set(null);
    this.previousItems = [];
    this.cdr.detectChanges();
    this.router.navigate(['/products']);
  }

  private async showToast(
    message: string,
    color: 'dark' | 'warning' | 'danger' | 'success' = 'dark',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
