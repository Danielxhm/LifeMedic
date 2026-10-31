import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-home-topbar',
  standalone: true,
  templateUrl: './home-topbar.component.html',
  styleUrls: ['./home-topbar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeTopbarComponent {
  cartCount = 4;
}