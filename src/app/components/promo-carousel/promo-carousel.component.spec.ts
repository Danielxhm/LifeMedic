import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { PromoCarouselComponent } from './promo-carousel.component';

describe('PromoCarouselComponent', () => {
  let component: PromoCarouselComponent;
  let fixture: ComponentFixture<PromoCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCarouselComponent, RouterModule.forRoot([])],
      providers: [provideIonicAngular()],
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 25000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 promotions for variety', () => {
    expect(component.promotions.length).toBe(4);
  });
});
