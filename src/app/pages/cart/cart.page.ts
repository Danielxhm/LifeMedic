import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  NavController,
  ToastController,
  AlertController,
} from '@ionic/angular';
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
  private readonly destroyRef = inject(DestroyRef);
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
    taxRate: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
  };
  previousSummary: CartSummary = {
    subtotal: 0,
    tax: 0,
    taxRate: 0,
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
    this.cartService.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        if (items.length > 0) {
          this.previousItems = [...items];
        }
        this.items = items;
        this.cdr.markForCheck();
      });

    this.cartService.summary$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((summary) => {
        if (summary.itemCount > 0) {
          this.previousSummary = { ...summary };
        }
        this.summary = summary;
        this.cdr.markForCheck();
      });
  }

  ionViewWillEnter(): void {
    if (this.authService.hasSessionToken()) {
      void this.cartService.refreshCart().catch(() => undefined);
      if (!this.authService.getCurrentUser()) {
        void this.authService.refreshProfile().catch(() => undefined);
      }
    }
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

  async onIncrement(item: CartItem): Promise<void> {
    const nextQty = item.quantity + 1;
    const maxStock = item.product.stock ?? 10;

    if (nextQty > maxStock) {
      await this.showToast(
        maxStock <= 0
          ? 'Stock máximo alcanzado: este producto está agotado.'
          : `Stock máximo alcanzado: solo quedan ${maxStock} unidades disponibles.`,
        'warning',
      );
      return;
    }

    const result = await this.cartService.updateQuantity(
      item.product.id,
      nextQty,
      item.selectedSize,
    );
    if (!result.success) {
      await this.showToast(result.message, 'warning');
    }
    this.cdr.markForCheck();
  }

  async onDecrement(item: CartItem): Promise<void> {
    if (item.quantity > 1) {
      const result = await this.cartService.updateQuantity(
        item.product.id,
        item.quantity - 1,
        item.selectedSize,
      );
      if (!result.success) {
        await this.showToast(result.message, 'warning');
      }
      this.cdr.markForCheck();
    } else {
      await this.confirmRemoveItem(item);
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
            void this.removeItem(item);
          },
        },
      ],
    });
    await alert.present();
  }

  async removeItem(item: CartItem): Promise<void> {
    const result = await this.cartService.removeItem(
      item.product.id,
      item.selectedSize,
    );
    await this.showToast(
      result.success
        ? `Se eliminó "${item.product.name}" del carrito`
        : result.message,
      result.success ? 'dark' : 'warning',
    );
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
          handler: async () => {
            try {
              await this.cartService.clearCart();
              await this.showToast('Carrito vaciado', 'dark');
            } catch (error) {
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : 'No se pudo vaciar el carrito.';
              await this.showToast(message, 'danger');
            } finally {
              this.cdr.markForCheck();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async proceedToCheckout(): Promise<void> {
    if (this.items.length === 0 || this.isSubmitting()) return;

    if (!this.authService.hasSessionToken()) {
      await this.router.navigate(['/auth/welcome'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.isSubmitting.set(true);
      this.cdr.markForCheck();
      try {
        const profileResult = await this.authService.refreshProfile();
        if (!this.authService.isLoggedIn()) {
          if (!this.authService.hasSessionToken()) {
            await this.router.navigate(['/auth/welcome'], {
              queryParams: { returnUrl: '/checkout' },
            });
          } else {
            await this.showToast(
              profileResult.message ||
                'No se pudo verificar tu sesión en el servidor.',
              'danger',
            );
          }
          return;
        }
      } finally {
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
      }
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
    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 1800,
        position: 'bottom',
        color,
      });
      await toast.present();
    } catch {
      // Ignore in test environments
    }
  }
}
