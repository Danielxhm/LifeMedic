import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Delete02Icon,
  File01Icon,
  HeadphonesIcon,
  Link01Icon,
  MailAdd01Icon,
  Notification01Icon,
  PackageIcon,
  PencilEdit01Icon,
  UserAccountIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ApiOrder, CartService } from '../../services/cart.service';
import { extractApiErrorMessage } from '../../utils/api-error.util';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: false,
})
export class AccountPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly PencilEdit01Icon = PencilEdit01Icon;
  readonly UserAccountIcon = UserAccountIcon;
  readonly MailAdd01Icon = MailAdd01Icon;
  readonly Notification01Icon = Notification01Icon;
  readonly HeadphonesIcon = HeadphonesIcon;
  readonly File01Icon = File01Icon;
  readonly Delete02Icon = Delete02Icon;
  readonly ArrowRight01Icon = ArrowRight01Icon;
  readonly Link01Icon = Link01Icon;
  readonly UserCircleIcon = UserCircleIcon;
  readonly PackageIcon = PackageIcon;
  readonly Cancel01Icon = Cancel01Icon;

  user: UserProfile | null = null;
  orders: ApiOrder[] = [];
  selectedOrder: ApiOrder | null = null;
  isOrdersModalOpen = false;
  isLoadingOrders = false;
  ordersError = '';
  isOrderDetailView = false;
  isLoadingOrderDetail = false;
  orderDetailError = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (!user) {
        this.orders = [];
        this.selectedOrder = null;
        this.isOrdersModalOpen = false;
        this.isOrderDetailView = false;
        this.isLoadingOrderDetail = false;
        this.orderDetailError = '';
      }
      this.cdr.markForCheck();
    });
  }

  ionViewWillEnter(): void {
    if (this.authService.hasSessionToken()) {
      void this.authService.refreshProfile().catch(() => undefined);
    }
  }

  getInitials(): string {
    if (!this.user) return 'LM';
    const first = this.user.firstName.charAt(0).toUpperCase();
    const last = this.user.lastName.charAt(0).toUpperCase();
    return `${first}${last}` || 'LM';
  }

  goToEditProfile(): void {
    this.router.navigate(['/account/edit-profile']);
  }

  goToChangeEmail(): void {
    this.router.navigate(['/account/change-email']);
  }

  goToChangePassword(): void {
    this.router.navigate(['/account/change-password']);
  }

  goToWelcome(): void {
    this.router.navigate(['/auth/welcome'], {
      queryParams: { returnUrl: '/account' },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: '/account' },
    });
  }

  async openOrdersModal(): Promise<void> {
    this.isOrdersModalOpen = true;
    this.isOrderDetailView = false;
    this.selectedOrder = null;
    this.isLoadingOrderDetail = false;
    this.orderDetailError = '';
    this.isLoadingOrders = true;
    this.ordersError = '';
    this.cdr.markForCheck();

    try {
      this.orders = await this.cartService.getOrders();
    } catch (error) {
      this.ordersError = extractApiErrorMessage(
        error,
        'No se pudieron cargar tus pedidos en este momento.',
      );
    } finally {
      this.isLoadingOrders = false;
      this.cdr.markForCheck();
    }
  }

  async openOrderDetail(order: ApiOrder): Promise<void> {
    this.isOrderDetailView = true;
    this.selectedOrder = null;
    this.isLoadingOrderDetail = true;
    this.orderDetailError = '';
    this.cdr.markForCheck();

    try {
      this.selectedOrder = await this.cartService.getOrderById(order.id);
    } catch (error) {
      this.orderDetailError = extractApiErrorMessage(
        error,
        'No se pudo cargar el detalle del pedido.',
      );
    } finally {
      this.isLoadingOrderDetail = false;
      this.cdr.markForCheck();
    }
  }

  backToOrdersList(): void {
    this.isOrderDetailView = false;
    this.selectedOrder = null;
    this.isLoadingOrderDetail = false;
    this.orderDetailError = '';
    this.cdr.markForCheck();
  }

  closeOrdersModal(): void {
    this.isOrdersModalOpen = false;
    this.isOrderDetailView = false;
    this.selectedOrder = null;
    this.isLoadingOrderDetail = false;
    this.orderDetailError = '';
    this.cdr.markForCheck();
  }

  formatOrderDate(dateIso?: string | null): string {
    if (!dateIso) {
      return '';
    }
    const parsed = new Date(dateIso);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatPrice(amount: number | undefined): string {
    return `$${Number(amount ?? 0).toFixed(2)}`;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    try {
      const toast = await this.toastCtrl.create({
        message: 'Sesión cerrada correctamente',
        duration: 1800,
        position: 'bottom',
        color: 'dark',
      });
      await toast.present();
    } catch {
      // Ignore in tests
    }
  }
}
