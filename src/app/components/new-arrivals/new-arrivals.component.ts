import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  ProductCardComponent,
  Product,
} from '../product-card/product-card.component';
import { CatalogApiService } from '../../services/catalog-api.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './new-arrivals.component.html',
  styleUrls: ['./new-arrivals.component.scss'],
})
export class NewArrivalsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cartService = inject(CartService);
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

  async addToCart(product: Product): Promise<void> {
    const result = await this.cartService.addItem(product, 1);

    try {
      const toast = await this.toastCtrl.create({
        message: result.message,
        duration: 2000,
        position: 'bottom',
        color: result.success ? 'dark' : 'warning',
        buttons: result.success
          ? [
              {
                text: 'Ver',
                handler: () => {
                  this.router.navigate(['/cart']);
                },
              },
            ]
          : undefined,
      });

      await toast.present();
    } catch {
      // Ignore toast presentation errors in tests
    }
  }

  viewAll(): void {
    this.router.navigate(['/products']);
  }
}