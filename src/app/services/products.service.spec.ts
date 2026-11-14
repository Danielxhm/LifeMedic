import { TestBed } from '@angular/core/testing';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 36 products and cover all catalog categories', () => {
    const products = service.getProducts();
    expect(products.length).toBe(36);
    const categoryIds = new Set(products.map((p) => p.categoryId));
    expect(categoryIds.has('dolor')).toBe(true);
    expect(categoryIds.has('estomago')).toBe(true);
    expect(categoryIds.has('alergias')).toBe(true);
    expect(categoryIds.has('primeros-auxilios')).toBe(true);
    expect(categoryIds.has('cuidado')).toBe(true);
  });

  it('should find Osteo-Bi Flex product by id 1', () => {
    const product = service.getProductById(1);
    expect(product).toBeDefined();
    expect(product?.name).toContain('Osteo-Bi Flex');
    expect(product?.laboratory).toBe('SUIZOS ETICOS');
    expect(product?.price).toBe(32.0);
    expect(product?.originalPrice).toBe(40.0);
    expect(product?.discountPercent).toBe(20);
  });

  it('should toggle favorite status', () => {
    const initial = service.getProductById(1)?.isFavorite;
    const toggled = service.toggleFavorite(1);
    expect(toggled).toBe(!initial);
    expect(service.getProductById(1)?.isFavorite).toBe(!initial);
  });

  it('should increment cart count', () => {
    const initial = service.getCartCount();
    const next = service.addToCart(1, 2);
    expect(next).toBe(initial + 2);
    expect(service.getCartCount()).toBe(initial + 2);
  });
});
