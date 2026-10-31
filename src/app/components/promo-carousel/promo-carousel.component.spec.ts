import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular/lazy';

import { PromoCarouselComponent } from './promo-carousel.component';

describe('PromoCarouselComponent', () => {
  let component: PromoCarouselComponent;
  let fixture: ComponentFixture<PromoCarouselComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PromoCarouselComponent],
      imports: [IonicModule.forRoot()],
    });

    fixture = TestBed.createComponent(PromoCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
