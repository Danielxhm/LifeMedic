import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { CheckoutPage } from './checkout.page';
import { CheckoutPageRoutingModule } from './checkout-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CheckoutPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [CheckoutPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckoutPageModule {}
