import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { AuthPageRoutingModule } from './auth-routing.module';
import { WelcomePage } from './welcome/welcome.page';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { AddressPage } from './address/address.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [WelcomePage, LoginPage, RegisterPage, AddressPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AuthPageModule {}
