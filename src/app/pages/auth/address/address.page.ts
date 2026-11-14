import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-address',
  templateUrl: './address.page.html',
  styleUrls: ['./address.page.scss'],
  standalone: false,
})
export class AddressPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastCtrl = inject(ToastController);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;

  street = '';
  municipality = '';
  city = '';
  postalCode = '';
  submitted = false;
  errorMessage = '';
  returnUrl = '/home';

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('returnUrl');
    if (param) {
      this.returnUrl = param;
    }

    if (!this.authService.getRegistrationDraft()) {
      this.router.navigate(['/auth/register'], {
        queryParams: { returnUrl: this.returnUrl },
        replaceUrl: true,
      });
    }
  }

  get isFormValid(): boolean {
    return (
      this.street.trim().length > 0 &&
      this.municipality.trim().length > 0 &&
      this.city.trim().length > 0 &&
      this.postalCode.trim().length > 0
    );
  }

  goBack(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: this.returnUrl },
      replaceUrl: true,
    });
  }

  async onFinish(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.isFormValid) {
      this.errorMessage = 'Por favor completa todos los datos de tu dirección de envío.';
      return;
    }

    const result = this.authService.completeRegistration({
      street: this.street.trim(),
      municipality: this.municipality.trim(),
      city: this.city.trim(),
      postalCode: this.postalCode.trim(),
    });

    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    try {
      const toast = await this.toastCtrl.create({
        message: '¡Cuenta y dirección guardadas con éxito!',
        duration: 2000,
        position: 'bottom',
        color: 'dark',
      });
      await toast.present();
    } catch {
      // Ignore toast presentation errors in test environments
    }

    this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
  }
}
