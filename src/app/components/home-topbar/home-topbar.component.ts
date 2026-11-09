import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { ShoppingBag01Icon } from '@hugeicons/core-free-icons';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-home-topbar',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './home-topbar.component.html',
  styleUrls: ['./home-topbar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeTopbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService, { optional: true });

  @Input() cartCount = 4;
  readonly ShoppingBag01Icon = ShoppingBag01Icon;

  ngOnInit(): void {
    if (this.cartService) {
      this.cartService.cartCount$.subscribe((count) => {
        this.cartCount = count;
      });
    }
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
