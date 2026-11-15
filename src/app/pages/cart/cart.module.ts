import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { CartPage } from './cart.page';
import { CartPageRoutingModule } from './cart-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CartPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [CartPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CartPageModule {}
