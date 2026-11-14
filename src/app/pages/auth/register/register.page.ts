import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrowLeft02Icon,
  Mail01Icon,
  SquareLock02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Mail01Icon = Mail01Icon;
  readonly SquareLock02Icon = SquareLock02Icon;
  readonly ViewIcon = ViewIcon;
  readonly ViewOffSlashIcon = ViewOffSlashIcon;

  firstName = '';
  lastName = '';
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

    const draft = this.authService.getRegistrationDraft();
    if (draft) {
      this.firstName = draft.firstName;
      this.lastName = draft.lastName;
      this.email = draft.email;
      this.password = draft.password;
    }
  }

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get isFormValid(): boolean {
    return (
      this.firstName.trim().length > 0 &&
      this.lastName.trim().length > 0 &&
      this.isEmailValid &&
      this.password.length >= 6
    );
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

  onNext(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.isFormValid) {
      this.errorMessage =
        'Por favor completa todos los campos correctamente (la contraseña debe tener al menos 6 caracteres).';
      return;
    }

    this.authService.setRegistrationDraft({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password,
    });

    this.router.navigate(['/auth/address'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }
}
