import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';

import { ProductsPage } from './products.page';
import { ProductsPageRoutingModule } from './products-routing.module';
import { HomeTopbarComponent } from '../../components/home-topbar/home-topbar.component';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    ProductsPageRoutingModule,
    HomeTopbarComponent,
    BottomNavComponent,
    ProductCardComponent,
    HugeiconsIconComponent,
  ],
  declarations: [ProductsPage],
})
export class ProductsPageModule {}
