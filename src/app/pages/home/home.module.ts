import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';

import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { PromoCarouselComponent } from '../../components/promo-carousel/promo-carousel.component';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { NewArrivalsComponent } from '../../components/new-arrivals/new-arrivals.component';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { HomeTopbarComponent } from '../../components/home-topbar/home-topbar.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';

@NgModule({
  imports: [
    CommonModule,
    IonContent,
    HomePageRoutingModule,
    PromoCarouselComponent,
    CategoryListComponent,
    NewArrivalsComponent,
    BottomNavComponent,
    HomeTopbarComponent,
    SearchBarComponent,
  ],
  declarations: [HomePage],
})
export class HomePageModule {}