import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular/lazy';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { of } from 'rxjs';

import { ProductDetailPage } from './product-detail.page';
import { ProductsService } from '../../services/products.service';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;
  let productsService: ProductsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductDetailPage],
      imports: [
        IonicModule.forRoot({ animated: false }),
        RouterModule.forRoot([]),
        HugeiconsIconComponent,
      ],
      providers: [
        ProductsService,
        NavController,
        ToastController,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
            params: of({ id: '1' }),
          },
        },
      ],
    }).compileComponents();

    productsService = TestBed.inject(ProductsService);
    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  it('should create the product detail page', () => {
    expect(component).toBeTruthy();
  });

  it('should load Osteo-Bi Flex by default for id 1', () => {
    expect(component.product).toBeDefined();
    expect(component.product?.name).toContain('Osteo-Bi Flex');
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

  it('should add product to cart and update count', async () => {
    const initialCart = component.cartCount;
    await component.addToCart();
    expect(component.cartCount).toBe(initialCart + 1);
  });
});
