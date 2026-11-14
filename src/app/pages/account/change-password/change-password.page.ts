import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
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

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly SquareLock02Icon = SquareLock02Icon;
  readonly ViewIcon = ViewIcon;
  readonly ViewOffSlashIcon = ViewOffSlashIcon;

  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  submitted = false;
  errorMessage = '';

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/account']);
    }
  }

  goBack(): void {
    this.router.navigate(['/account']);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (this.newPassword.length < 6) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    const result = this.authService.updatePassword(this.newPassword);
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
  }
}
