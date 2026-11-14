import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import {
  ArrowLeft02Icon,
  Mail01Icon,
  SquareLock02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastCtrl = inject(ToastController);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Mail01Icon = Mail01Icon;
  readonly SquareLock02Icon = SquareLock02Icon;
  readonly ViewIcon = ViewIcon;
  readonly ViewOffSlashIcon = ViewOffSlashIcon;

  email = '';
  password = '';
  showPassword = false;
  submitted = false;
  errorMessage = '';
  returnUrl = '/home';

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('returnUrl');
    if (param) {
      this.returnUrl = param;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goBack(): void {
    this.router.navigate(['/auth/welcome'], {
      queryParams: { returnUrl: this.returnUrl },
      replaceUrl: true,
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: this.returnUrl },
      replaceUrl: true,
    });
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    const result = this.authService.login(this.email, this.password);
    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    try {
      const toast = await this.toastCtrl.create({
        message: result.message,
        duration: 1800,
        position: 'bottom',
        color: 'dark',
      });
      await toast.present();
    } catch {
      // Ignore toast failure in tests
    }

    this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
  }
}
