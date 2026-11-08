import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { NewArrivalsComponent } from './new-arrivals.component';

describe('NewArrivalsComponent', () => {
  let component: NewArrivalsComponent;
  let fixture: ComponentFixture<NewArrivalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewArrivalsComponent, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NewArrivalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
