import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ProductCardComponent,
  Product,
} from '../product-card/product-card.component';
import { CatalogApiService } from '../../services/catalog-api.service';

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './new-arrivals.component.html',
  styleUrls: ['./new-arrivals.component.scss'],
})
export class NewArrivalsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  newestProducts: Product[] = [];

  ngOnInit(): void {
    this.catalogApi.getHomeProducts().subscribe({
      next: (products) => {
        this.newestProducts = products;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('No se pudieron cargar los productos:', error);
      },
    });
  }

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