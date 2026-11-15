import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { ProductsPageModule } from './products.module';
import { ProductsPage } from './products.page';
import { CartService } from '../../services/cart.service';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;
  let httpMock: HttpTestingController;
  let cartService: CartService;
  let router: Router;
  const apiUrl = environment.apiUrl;

  const mockToast = {
    present: vi.fn().mockResolvedValue(true),
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue(mockToast),
  };

  const mockApiMedicines = [
    {
      id: 1,
      codigo: 'MED-001',
      category_id: 1,
      category: { name: 'Analgesicos' },
      catalog_type: 'medicine',
      name: 'Tylenol Extra Fuerte',
      brand: 'TYLENOL',
      laboratory: 'JANSSEN',
      price: 12.5,
      previous_price: 15.0,
      stock: 10,
      available: true,
      image_url: '/assets/images/paracetamol.jpg',
    },
    {
      id: 2,
      codigo: 'MED-002',
      category_id: 2,
      category: { name: 'Estomago' },
      catalog_type: 'medicine',
      name: 'Omeprazol 20mg',
      brand: 'GENFAR',
      price: 8.0,
      stock: 5,
      available: true,
      image_url: '/assets/images/paracetamol.jpg',
    },
  ];

  const mockCategories = [
    { id: 1, name: 'Analgesicos', slug: 'analgesicos' },
    { id: 2, name: 'Estomago', slug: 'estomago' },
  ];

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }

    await TestBed.configureTestingModule({
      imports: [ProductsPageModule, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);
    TestBed.inject(ActivatedRoute);

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock
      .expectOne(`${apiUrl}/v1/medicines?catalog_type=all&per_page=100`)
      .flush({ data: { data: mockApiMedicines } });
    httpMock
      .expectOne(`${apiUrl}/categories`)
      .flush({ data: mockCategories });
    fixture.detectChanges();
  }, 25000);

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load catalog products and categories from API', () => {
    expect(component).toBeTruthy();
    expect(component.products.length).toBe(2);
    expect(component.filteredProducts.length).toBe(2);
    expect(component.products[0].codigo).toBe('MED-001');
    expect(component.products[0].originalPrice).toBe(15.0);
    expect(component.products[0].discountPercent).toBe(17);
    expect(component.cartCount).toBe(0);
  });

  it('should filter products by search query', () => {
    component.searchQuery = 'Tylenol';
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].brand).toBe('TYLENOL');
  });

  it('should filter products by category id', () => {
    component.selectCategory('2');
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name).toBe('Omeprazol 20mg');
  });

  it('should add product to CartService and update live cartCount', async () => {
    expect(cartService.getCartCount()).toBe(0);
    await component.addToCart(component.products[0]);
    expect(cartService.getCartCount()).toBe(1);
    expect(component.cartCount).toBe(1);
  });

  it('should reactively update selectedCategoryId and searchQuery when route queryParamMap changes', async () => {
    await router.navigate([], { queryParams: { categoryId: '2' } });
    fixture.detectChanges();
    expect(component.selectedCategoryId).toBe('2');
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name).toBe('Omeprazol 20mg');

    await router.navigate([], {
      queryParams: { categoryId: '1', search: 'Tylenol' },
    });
    fixture.detectChanges();
    expect(component.selectedCategoryId).toBe('1');
    expect(component.searchQuery).toBe('Tylenol');
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].brand).toBe('TYLENOL');

    await router.navigate([], { queryParams: {} });
    fixture.detectChanges();
    expect(component.selectedCategoryId).toBe('all');
    expect(component.searchQuery).toBe('');
    expect(component.filteredProducts.length).toBe(2);
  });

  it('should refresh catalog on subsequent ionViewWillEnter calls', () => {
    // First call immediately after ngOnInit is skipped (avoid duplicate initial fetch)
    component.ionViewWillEnter();
    httpMock.expectNone(`${apiUrl}/v1/medicines?catalog_type=all&per_page=100`);

    // Second enter triggers a fresh catalog fetch
    component.ionViewWillEnter();
    httpMock
      .expectOne(`${apiUrl}/v1/medicines?catalog_type=all&per_page=100`)
      .flush({ data: { data: mockApiMedicines } });
    fixture.detectChanges();
    expect(component.products.length).toBe(2);
  });

  it('should expose catalogError on load failure and recover via retryCatalogLoad()', () => {
    component.ionViewWillEnter();
    component.ionViewWillEnter();
    httpMock
      .expectOne(`${apiUrl}/v1/medicines?catalog_type=all&per_page=100`)
      .error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(component.catalogError).toContain('No se pudo conectar con el servidor');

    component.retryCatalogLoad();
    httpMock
      .expectOne(`${apiUrl}/v1/medicines?catalog_type=all&per_page=100`)
      .flush({ data: { data: mockApiMedicines } });
    fixture.detectChanges();

    expect(component.catalogError).toBe('');
    expect(component.products.length).toBe(2);
  });
});
