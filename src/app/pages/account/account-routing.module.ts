import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AccountPage } from './account.page';
import { ChangeEmailPage } from './change-email/change-email.page';
import { ChangePasswordPage } from './change-password/change-password.page';
import { EditProfilePage } from './edit-profile/edit-profile.page';

const routes: Routes = [
  {
    path: '',
    component: AccountPage,
  },
  {
    path: 'change-email',
    component: ChangeEmailPage,
  },
  {
    path: 'change-password',
    component: ChangePasswordPage,
  },
  {
    path: 'edit-profile',
    component: EditProfilePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountPageRoutingModule {}
