import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { NewArrivalsComponent } from './new-arrivals.component';
import { CartService } from '../../services/cart.service';

describe('NewArrivalsComponent', () => {
  let component: NewArrivalsComponent;
  let fixture: ComponentFixture<NewArrivalsComponent>;
  let httpMock: HttpTestingController;
  let cartService: CartService;

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
      imports: [NewArrivalsComponent, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CartService,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);

    fixture = TestBed.createComponent(NewArrivalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/v1/medicines?catalog_type=all&per_page=5`)
      .flush({
        data: {
          data: [
            {
              id: 3,
              codigo: 'MED-003',
              category_id: 1,
              catalog_type: 'medicine',
              name: 'Aspirina 500mg',
              brand: 'BAYER',
              price: 4.5,
              stock: 15,
              available: true,
              image_url: '/assets/images/aspirina.jpg',
            },
          ],
        },
      });
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load home products', () => {
    expect(component).toBeTruthy();
    expect(component.newestProducts.length).toBe(1);
    expect(component.newestProducts[0].name).toBe('Aspirina 500mg');
  });

  it('should add product to CartService when addToCart is called', async () => {
    expect(cartService.getCartCount()).toBe(0);
    await component.addToCart(component.newestProducts[0]);
    expect(cartService.getCartCount()).toBe(1);
    expect(mockToastCtrl.create).toHaveBeenCalled();
  });
});
