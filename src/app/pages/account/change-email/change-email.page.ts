import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import { ArrowLeft02Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-email',
  templateUrl: './change-email.page.html',
  styleUrls: ['./change-email.page.scss'],
  standalone: false,
})
export class ChangeEmailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Mail01Icon = Mail01Icon;

  email = '';
  submitted = false;
  errorMessage = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/account']);
      return;
    }
    this.email = user.email;
  }

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  goBack(): void {
    this.router.navigate(['/account']);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    const result = this.authService.updateEmail(this.email);
    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    try {
      const toast = await this.toastCtrl.create({
        message: 'Correo actualizado correctamente',
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
