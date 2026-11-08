import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { ProductDetailPage } from './product-detail.page';
import { ProductDetailPageRoutingModule } from './product-detail-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductDetailPageRoutingModule,
    HugeiconsIconComponent,
  ],
  declarations: [ProductDetailPage],
})
export class ProductDetailPageModule {}
