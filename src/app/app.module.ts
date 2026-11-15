import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular/lazy';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot({
      animated: false,
    }),
    AppRoutingModule,
    BottomNavComponent,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}