import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import {
  IonApp,
  IonRouterOutlet,
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonApp,
    IonRouterOutlet,
    AppRoutingModule,
    BottomNavComponent,
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideIonicAngular({
      animated: false,
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}