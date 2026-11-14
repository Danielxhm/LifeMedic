import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  showBottomNav = true;

  ngOnInit(): void {
    this.updateBottomNavVisibility(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBottomNavVisibility(event.urlAfterRedirects);
      });
  }

  private updateBottomNavVisibility(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.showBottomNav =
      !cleanUrl.startsWith('/auth') &&
      !cleanUrl.startsWith('/checkout') &&
      !cleanUrl.startsWith('/account/');
  }
}
