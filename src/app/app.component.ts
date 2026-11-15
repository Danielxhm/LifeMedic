import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonRouterOutlet } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  @ViewChild(IonRouterOutlet) private routerOutlet?: IonRouterOutlet;
  @ViewChild(IonRouterOutlet, { read: ElementRef })
  private routerOutletEl?: ElementRef<HTMLElement>;

  showBottomNav = true;

  ngOnInit(): void {
    this.updateBottomNavVisibility(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.clearLeavingPageFocus();
        this.updateBottomNavVisibility(event.urlAfterRedirects);
        this.cdr.markForCheck();
      });

    if (this.authService.hasSessionToken()) {
      void this.authService.refreshProfile().catch(() => undefined);
      void this.cartService.refreshCart().catch(() => undefined);
    }
  }

  onOutletWillChange(): void {
    this.clearLeavingPageFocus();
  }

  private clearLeavingPageFocus(): void {
    const activeElement = this.document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return;
    }

    const outletEl =
      this.routerOutletEl?.nativeElement ??
      this.document.querySelector('ion-router-outlet');
    if (!outletEl || !outletEl.contains(activeElement)) {
      return;
    }

    const activePageEl = this.routerOutlet?.activatedComponentRef?.location
      ?.nativeElement as HTMLElement | undefined;
    if (!activePageEl || !activePageEl.contains(activeElement)) {
      activeElement.blur();
    }
  }

  private updateBottomNavVisibility(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.showBottomNav =
      !cleanUrl.startsWith('/auth') &&
      !cleanUrl.startsWith('/checkout') &&
      !cleanUrl.startsWith('/account/');
  }
}
