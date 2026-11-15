import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  ArrowLeft02Icon,
  SquareLock02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: false,
})
export class ChangePasswordPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly SquareLock02Icon = SquareLock02Icon;
  readonly ViewIcon = ViewIcon;
  readonly ViewOffSlashIcon = ViewOffSlashIcon;

  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  private initializedOnCurrentEnter = false;

  ngOnInit(): void {
    this.initializedOnCurrentEnter = true;
    void this.ensureAuthenticated();
  }

  ionViewWillEnter(): void {
    if (this.initializedOnCurrentEnter) {
      this.initializedOnCurrentEnter = false;
      return;
    }
    void this.ensureAuthenticated();
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authService.hasSessionToken()) {
      this.router.navigate(['/account']);
      return;
    }

    if (!this.authService.isLoggedIn()) {
      const result = await this.authService.refreshProfile();
      if (!result.user && !this.authService.isLoggedIn()) {
        this.router.navigate(['/account']);
      }
      this.cdr.markForCheck();
    }
  }

  goBack(): void {
    this.router.navigate(['/account']);
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitted = true;
    this.errorMessage = '';

    if (this.newPassword.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      this.cdr.markForCheck();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    try {
      const result = await this.authService.updatePassword(
        this.newPassword,
        this.confirmPassword,
      );
      if (!result.success) {
        this.errorMessage = result.message;
        return;
      }

      try {
        const toast = await this.toastCtrl.create({
          message: 'Contraseña actualizada correctamente',
          duration: 1800,
          position: 'bottom',
          color: 'dark',
        });
        await toast.present();
      } catch {
        // Ignore in test environments
      }

      this.router.navigate(['/account']);
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
