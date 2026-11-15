import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { AppComponent } from './app.component';
import { AppModule } from './app.module';

@Component({
  selector: 'app-dummy-home',
  template: '<button type="button" class="category-chip">Cat 1</button>',
  standalone: true,
})
class DummyHomeComponent {}

@Component({
  selector: 'app-dummy-products',
  template: '<button type="button" class="filter-chip">Filter</button>',
  standalone: true,
})
class DummyProductsComponent {}

describe('AppComponent', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    warnSpy = vi.spyOn(console, 'warn');
    await TestBed.configureTestingModule({
      imports: [AppModule],
    }).compileComponents();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should create the app without IonicModule deprecation warnings', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();

    const deprecationWarnings = warnSpy.mock.calls.filter((args: unknown[]) =>
      String(args[0]).includes('IonicModule has been deprecated'),
    );
    expect(deprecationWarnings).toHaveLength(0);
  });

  it('should blur focused controls in a leaving page on navigation', async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: 'home', component: DummyHomeComponent },
      { path: 'products', component: DummyProductsComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await router.navigate(['/home']);
    fixture.detectChanges();
    await fixture.whenStable();

    const chipButton = fixture.nativeElement.querySelector(
      'button.category-chip',
    ) as HTMLButtonElement | null;
    expect(chipButton).toBeTruthy();

    chipButton!.focus();
    expect(document.activeElement).toBe(chipButton);

    await router.navigate(['/products'], { queryParams: { categoryId: 1 } });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(document.activeElement).not.toBe(chipButton);
    const homeHost = fixture.nativeElement.querySelector(
      'app-dummy-home',
    ) as HTMLElement | null;
    if (homeHost) {
      expect(homeHost.contains(document.activeElement)).toBe(false);
    }
  });
});
