import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { AccountPage } from './account.page';
import { AccountPageRoutingModule } from './account-routing.module';
import { ChangeEmailPage } from './change-email/change-email.page';
import { ChangePasswordPage } from './change-password/change-password.page';
import { EditProfilePage } from './edit-profile/edit-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    AccountPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [
    AccountPage,
    ChangeEmailPage,
    ChangePasswordPage,
    EditProfilePage,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccountPageModule {}
