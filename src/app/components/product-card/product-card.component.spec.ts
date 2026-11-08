import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ProductCardComponent, Product } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: 1,
    brand: 'ADVIL',
    name: 'Osteo-Bi Flex Complex',
    price: 7.5,
    currency: 'USD',
    image: 'assets/images/osteo-biflex.jpg',
    badge: 'OFERTA',
    badgeType: 'green',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit favoriteToggled event', () => {
    let emitted: Product | undefined;
    component.favoriteToggled.subscribe((p) => (emitted = p));

    const fakeEvent = new Event('click');
    component.onToggleFavorite(fakeEvent);

    expect(emitted).toEqual(mockProduct);
  });

  it('should emit addedToCart event', () => {
    let emitted: Product | undefined;
    component.addedToCart.subscribe((p) => (emitted = p));

    const fakeEvent = new Event('click');
    component.onAddToCart(fakeEvent);

    expect(emitted).toEqual(mockProduct);
  });
});
