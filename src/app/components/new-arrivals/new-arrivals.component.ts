import { Component } from '@angular/core';

interface Product {
  id: number;
  brand: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  createdAt: string;
  badge?: string;
}

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  templateUrl: './new-arrivals.component.html',
  styleUrls: ['./new-arrivals.component.scss'],
})
export class NewArrivalsComponent {
  private readonly products: Product[] = [
    {
      id: 1,
      brand: 'Murad',
      name: 'Crema de Noche con Retinol',
      price: 25,
      currency: 'USD',
      image: 'assets/images/retinol.png',
      createdAt: '2026-10-28',
      badge: 'NUEVO',
    },
    {
      id: 2,
      brand: 'Protección diaria',
      name: 'Protector solar',
      price: 14.5,
      currency: 'USD',
      image: 'assets/images/protector-solar.png',
      createdAt: '2026-10-25',
    },
  ];

  readonly newestProducts = [...this.products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  toggleFavorite(product: Product): void {
    console.log('Cambiar favorito:', product.name);
  }

  addToCart(product: Product): void {
    console.log('Agregar al carrito:', product.name);
  }

  viewAll(): void {
    console.log('Ver todos los productos nuevos');
  }
}