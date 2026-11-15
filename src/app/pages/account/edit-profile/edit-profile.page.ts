import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: false,
})
export class EditProfilePage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;

  firstName = '';
  lastName = '';
  street = '';
  municipality = '';
  city = '';
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  private initializedOnCurrentEnter = false;

  ngOnInit(): void {
    this.initializedOnCurrentEnter = true;
    void this.ensureUserAndPrefill();
  }

  ionViewWillEnter(): void {
    if (this.initializedOnCurrentEnter) {
      this.initializedOnCurrentEnter = false;
      return;
    }
    void this.ensureUserAndPrefill();
  }

  private async ensureUserAndPrefill(): Promise<void> {
    if (!this.authService.hasSessionToken()) {
      this.router.navigate(['/account']);
      return;
    }

    let user = this.authService.getCurrentUser();
    if (!user) {
      const result = await this.authService.refreshProfile();
      user = result.user ?? this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/account']);
        this.cdr.markForCheck();
        return;
      }
    }

    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.street = user.address.street;
    this.municipality = user.address.municipality;
    this.city = user.address.city;
    this.cdr.markForCheck();
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
    this.isSubmitting = true;

    try {
      const result = await this.authService.updateProfileData({
        firstName: this.firstName,
        lastName: this.lastName,
        street: this.street,
        municipality: this.municipality,
        city: this.city,
      });

      if (!result.success) {
        this.errorMessage = result.message;
        return;
      }

      try {
        const toast = await this.toastCtrl.create({
          message: 'Datos personales guardados con éxito',
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
