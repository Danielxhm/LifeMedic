import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';

import { HomePageModule } from './home.module';
import { HomePage } from './home.page';
import { CartService } from '../../services/cart.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let cartService: CartService;

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      imports: [HomePageModule, RouterModule.forRoot([])],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect live CartService cartCount$ inside app-home-topbar badge', async () => {
    await cartService.addItem({
      id: 1,
      codigo: 'MED-00001',
      brand: 'OSTEO',
      name: 'Osteo-Bi Flex',
      price: 32,
      currency: 'USD',
      image: 'assets/images/vitamina-c.png',
      description: 'Test',
      category: 'Suplementos',
      inStock: true,
      stock: 5,
    });
    fixture.detectChanges();

    const badge = (fixture.nativeElement as HTMLElement).querySelector(
      '.home-topbar__badge',
    );
    expect(badge?.textContent?.trim()).toBe('1');
  });
});
