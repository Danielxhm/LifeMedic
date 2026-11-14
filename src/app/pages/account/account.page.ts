import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import {
  ArrowRight01Icon,
  Delete02Icon,
  File01Icon,
  HeadphonesIcon,
  Link01Icon,
  MailAdd01Icon,
  Notification01Icon,
  PencilEdit01Icon,
  UserAccountIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: false,
})
export class AccountPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  readonly authService = inject(AuthService);

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

  user: UserProfile | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
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

  async logout(): Promise<void> {
    this.authService.logout();
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
