import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ProductCardComponent,
  Product,
} from '../product-card/product-card.component';

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './new-arrivals.component.html',
  styleUrls: ['./new-arrivals.component.scss'],
})
export class NewArrivalsComponent {
  private readonly router = inject(Router);

  readonly newestProducts: Product[] = [
    {
      id: 1,
      brand: 'MURAD',
      name: 'Crema de Noche con Retinol',
      price: 25.0,
      currency: 'USD',
      image: 'assets/images/retinol.png',
      badge: 'NUEVO',
      badgeType: 'dark',
      createdAt: '2026-10-28',
      isFavorite: false,
    },
    {
      id: 2,
      brand: 'PROTECCIÓN DIARIA',
      name: 'Protector solar FPS 50+',
      price: 14.5,
      currency: 'USD',
      image: 'assets/images/protector-solar.png',
      badge: 'OFERTA',
      badgeType: 'green',
      createdAt: '2026-10-25',
      isFavorite: false,
    },
  ];

  toggleFavorite(product: Product): void {
    product.isFavorite = !product.isFavorite;
  }

  addToCart(product: Product): void {
    console.log('Producto añadido al carrito:', product.name);
  }

  viewAll(): void {
    this.router.navigate(['/products']);
  }
}
