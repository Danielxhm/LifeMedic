import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { ShoppingBag01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-home-topbar',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './home-topbar.component.html',
  styleUrls: ['./home-topbar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeTopbarComponent {
  @Input() cartCount = 4;
  readonly ShoppingBag01Icon = ShoppingBag01Icon;
}
