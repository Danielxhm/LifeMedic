import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { ProductDetailPage } from './product-detail.page';
import { ProductDetailPageRoutingModule } from './product-detail-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    ProductDetailPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [ProductDetailPage],
})
export class ProductDetailPageModule {}
