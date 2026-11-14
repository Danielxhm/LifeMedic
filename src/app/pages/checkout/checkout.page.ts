import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular/lazy';
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { AuthService, UserProfile } from '../../services/auth.service';
import {
  CartItem,
  CartService,
  CartSummary,
  OrderPayload,
  PaymentMethodType,
} from '../../services/cart.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false,
})
export class CheckoutPage implements OnInit {
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Tick02Icon = Tick02Icon;
  readonly CheckmarkCircle02Icon = CheckmarkCircle02Icon;

  items: CartItem[] = [];
  summary: CartSummary = {
    subtotal: 0,
    tax: 0,
    taxRate: 0.103846,
    shipping: 0,
    total: 0,
    itemCount: 0,
  };
  previousSummary: CartSummary = { ...this.summary };

  fullName = '';
  phone = '';
  address = '';
  city = '';
  postalCode = '';
  paymentMethod: PaymentMethodType | null = null;

  submitted = false;
  readonly isSubmitting = signal(false);
  readonly confirmedOrder = signal<OrderPayload | null>(null);
  readonly isOrderModalOpen = signal(false);

  ngOnInit(): void {
    this.cartService.items$.subscribe((items) => {
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

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.prefillFromUser(user);
      }
    });

    this.ensureSessionAndPrefill();
  }

  ionViewWillEnter(): void {
    this.ensureSessionAndPrefill();
  }

  formatPrice(amount: number | undefined): string {
    return `$${(amount ?? 0).toFixed(2)}`;
  }

  selectPaymentMethod(method: PaymentMethodType): void {
    this.paymentMethod = method;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
    } else {
      this.router.navigate(['/cart']);
    }
  }

  async openPrivacyPolicy(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Políticas de Privacidad',
      message:
        'Tus datos personales, dirección de entrega y preferencias de pago están cifrados con SSL 256-bit y se utilizan exclusivamente para procesar y entregar tus pedidos médicos.',
      buttons: ['Cerrar'],
    });
    await alert.present();
  }

  async confirmAndPay(): Promise<void> {
    this.submitted = true;
    if (this.isSubmitting()) return;

    if (this.items.length === 0) {
      await this.showToast('Tu carrito está vacío.', 'warning');
      this.router.navigate(['/products']);
      return;
    }

    if (
      !this.fullName.trim() ||
      !this.phone.trim() ||
      !this.address.trim() ||
      !this.city.trim() ||
      !this.postalCode.trim()
    ) {
      await this.showToast(
        'Completa todos los campos de la dirección de entrega.',
        'warning',
      );
      return;
    }

    if (!this.paymentMethod) {
      await this.showToast(
        'Selecciona un método de pago para continuar.',
        'warning',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.authService.updateDeliveryInfo({
      phone: this.phone.trim(),
      street: this.address.trim(),
      city: this.city.trim(),
      postalCode: this.postalCode.trim(),
    });

    try {
      const order = await this.cartService.submitOrder({
        shippingInfo: {
          fullName: this.fullName.trim(),
          phone: this.phone.trim(),
          address: this.address.trim(),
          city: this.city.trim(),
          postalCode: this.postalCode.trim(),
        },
        paymentMethod: this.paymentMethod,
      });

      this.confirmedOrder.set(order);
      this.isSubmitting.set(false);
      this.isOrderModalOpen.set(true);
      this.cdr.detectChanges();
    } catch {
      this.isSubmitting.set(false);
      this.cdr.detectChanges();
      await this.showToast(
        'Error al procesar el pago. Intenta nuevamente.',
        'danger',
      );
    }
  }

  closeOrderModal(): void {
    this.isOrderModalOpen.set(false);
    this.confirmedOrder.set(null);
    this.cdr.detectChanges();
    this.router.navigate(['/products']);
  }

  private ensureSessionAndPrefill(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/welcome'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }
    this.prefillFromUser(user);
  }

  private prefillFromUser(user: UserProfile): void {
    this.fullName = `${user.firstName} ${user.lastName}`.trim();
    this.phone = user.phone ?? '';
    const street = user.address.street.trim();
    const municipality = user.address.municipality.trim();
    const city = user.address.city.trim();

    this.address =
      municipality &&
      municipality.toLowerCase() !== city.toLowerCase() &&
      !street.toLowerCase().includes(municipality.toLowerCase())
        ? `${street}, ${municipality}`
        : street;
    this.city = city;
    this.postalCode = user.address.postalCode.trim();
    this.cdr.markForCheck();
  }

  private async showToast(
    message: string,
    color: 'dark' | 'warning' | 'danger' | 'success' = 'dark',
  ): Promise<void> {
    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 2000,
        position: 'bottom',
        color,
      });
      await toast.present();
    } catch {
      // Ignore in test environments
    }
  }
}
