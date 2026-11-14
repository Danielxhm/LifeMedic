import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular/lazy';
import { ArrowLeft02Icon, Mail01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-auth-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navCtrl = inject(NavController);
  private readonly alertCtrl = inject(AlertController);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly Mail01Icon = Mail01Icon;

  returnUrl = '/home';

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('returnUrl');
    if (param) {
      this.returnUrl = param;
    }
  }

  goBack(): void {
    this.navCtrl.navigateRoot('/home');
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }

  async openPolicy(type: 'terms' | 'privacy'): Promise<void> {
    const isTerms = type === 'terms';
    const alert = await this.alertCtrl.create({
      header: isTerms ? 'Términos de uso' : 'Política de privacidad',
      message: isTerms
        ? 'LifeMedic facilita la compra segura de medicamentos y productos de cuidado personal con entrega rápida.'
        : 'Tus datos personales y dirección de entrega se almacenan de forma protegida únicamente para coordinar tus envíos.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }
}
