import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WelcomePage } from './welcome/welcome.page';
import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { AddressPage } from './address/address.page';

const routes: Routes = [
  {
    path: 'welcome',
    component: WelcomePage,
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'address',
    component: AddressPage,
  },
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
