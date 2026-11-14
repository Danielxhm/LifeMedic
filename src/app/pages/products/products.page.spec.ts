import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { ProductsPageModule } from './products.module';
import { ProductsPage } from './products.page';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPageModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 36 products', () => {
    expect(component.products.length).toBe(36);
    expect(component.filteredProducts.length).toBe(36);
  });

  it('should filter products by search query', () => {
    component.searchQuery = 'Tylenol';
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].brand).toBe('TYLENOL');
  });

  it('should filter products by category', () => {
    component.selectCategory('estomago');
    expect(component.filteredProducts.length).toBe(7);
  });
});
