import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  NavController,
  ToastController,
  provideIonicAngular,
} from '@ionic/angular';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ProductDetailPage } from './product-detail.page';
import { CartService } from '../../services/cart.service';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;
  let httpMock: HttpTestingController;
  let cartService: CartService;
  const apiUrl = environment.apiUrl;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      declarations: [ProductDetailPage],
      imports: [
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        RouterModule.forRoot([]),
        HugeiconsIconComponent,
      ],
      providers: [
        provideIonicAngular({ animated: false }),
        provideHttpClient(),
        provideHttpClientTesting(),
        CartService,
        NavController,
        { provide: ToastController, useValue: mockToastCtrl },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
              queryParamMap: {
                get: (key: string) => (key === 'type' ? 'medicine' : null),
              },
            },
            params: of({ id: '1' }),
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.ionViewWillEnter();
    httpMock.expectOne(`${apiUrl}/v1/medicines/1`).flush({
      data: {
        id: 1,
        codigo: 'MED-00001',
        category_id: 3,
        category: { name: 'Suplementos' },
        catalog_type: 'medicine',
        name: 'Osteo-Bi Flex Triple Strength',
        brand: 'OSTEO',
        laboratory: 'SUIZOS ETICOS',
        price: 32.0,
        previous_price: 40.0,
        stock: 6,
        available: true,
        image_url: '/assets/images/vitamina-c.png',
      },
    });
    fixture.detectChanges();
  }, 25000);

  afterEach(() => {
    httpMock.verify();
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
  });

  it('should create the product detail page and align back button with slot="start"', () => {
    expect(component).toBeTruthy();
    const backBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.nav-btn--back',
    );
    expect(backBtn?.getAttribute('slot')).toBe('start');
  });

  it('should load Osteo-Bi Flex from API including previous_price discount and codigo', () => {
    expect(component.product).toBeDefined();
    expect(component.product?.name).toContain('Osteo-Bi Flex');
    expect(component.product?.codigo).toBe('MED-00001');
    expect(component.product?.laboratory).toBe('SUIZOS ETICOS');
    expect(component.product?.price).toBe(32.0);
    expect(component.product?.originalPrice).toBe(40.0);
    expect(component.product?.discountPercent).toBe(20);
  });

  it('should switch selected size', () => {
    component.selectSize('100ml');
    expect(component.selectedSize).toBe('100ml');
  });

  it('should select gallery image index', () => {
    component.selectImage(1);
    expect(component.activeImageIndex).toBe(1);
  });

  it('should toggle favorite status', async () => {
    const initial = component.product?.isFavorite;
    await component.toggleFavorite();
    expect(component.product?.isFavorite).toBe(!initial);
  });

  it('should add product to CartService and update live cartCount', async () => {
    expect(component.cartCount).toBe(0);
    await component.addToCart();
    expect(component.cartCount).toBe(1);
    expect(cartService.getCartCount()).toBe(1);
  });

  it('should display Agotado and disable add-to-cart button when product is out of stock', () => {
    component.ionViewWillEnter();
    httpMock.expectOne(`${apiUrl}/v1/medicines/1`).flush({
      data: {
        id: 1,
        codigo: 'MED-00001',
        category_id: 3,
        category: { name: 'Suplementos' },
        catalog_type: 'medicine',
        name: 'Osteo-Bi Flex Triple Strength',
        brand: 'OSTEO',
        laboratory: 'SUIZOS ETICOS',
        price: 32.0,
        previous_price: 40.0,
        stock: 0,
        available: false,
        image_url: '/assets/images/vitamina-c.png',
      },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.feature-text')?.textContent?.trim()).toBe('Agotado');
    expect(
      (el.querySelector('.action-cart-btn') as HTMLButtonElement | null)?.disabled,
    ).toBe(true);
  });
});
