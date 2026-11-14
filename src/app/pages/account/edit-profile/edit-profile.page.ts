import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
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

  readonly ArrowLeft02Icon = ArrowLeft02Icon;

  firstName = '';
  lastName = '';
  street = '';
  municipality = '';
  city = '';
  submitted = false;
  errorMessage = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/account']);
      return;
    }

    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.street = user.address.street;
    this.municipality = user.address.municipality;
    this.city = user.address.city;
  }

  goBack(): void {
    this.router.navigate(['/account']);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    const result = this.authService.updateProfileData({
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
  }
}
