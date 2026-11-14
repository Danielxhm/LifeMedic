import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { CheckoutPage } from './checkout.page';
import { CheckoutPageRoutingModule } from './checkout-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CheckoutPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [CheckoutPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckoutPageModule {}
