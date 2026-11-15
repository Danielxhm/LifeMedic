import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import {
  ArrowLeft02Icon,
  ShoppingBag01Icon,
  StarIcon,
  PackageIcon,
  DeliveryTruck01Icon,
  Store01Icon,
  FavouriteIcon,
} from '@hugeicons/core-free-icons';
import { Product } from '../../components/product-card/product-card.component';
import { CatalogApiService } from '../../services/catalog-api.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: false,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly toastCtrl = inject(ToastController);
  private readonly cartService = inject(CartService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly ArrowLeft02Icon = ArrowLeft02Icon;
  readonly ShoppingBag01Icon = ShoppingBag01Icon;
  readonly StarIcon = StarIcon;
  readonly PackageIcon = PackageIcon;
  readonly DeliveryTruck01Icon = DeliveryTruck01Icon;
  readonly Store01Icon = Store01Icon;
  readonly FavouriteIcon = FavouriteIcon;

  product: Product | null = null;
  activeImageIndex = 0;
  selectedSize = '';
  cartCount = this.cartService.getCartCount();

  ngOnInit(): void {
    this.cartService.cartCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.cartCount = count;
        this.cdr.markForCheck();
      });
  }

  ionViewWillEnter(): void {
    this.cartCount = this.cartService.getCartCount();

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    const type = typeParam === 'product' ? 'product' : 'medicine';

    if (!Number.isInteger(id)) {
      this.product = null;
      return;
    }

    this.product = null;

    this.catalogApi.getCatalogProductById(id, type).subscribe({
      next: (product) => {
        this.product = product;
        this.selectedSize = product.sizes?.[0] ?? '';
        this.activeImageIndex = 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('No se pudo cargar el detalle del producto:', error);
        this.product = null;
        this.cdr.detectChanges();
      },
    });
  }

  get galleryImages(): string[] {
    if (!this.product) {
      return [];
    }

    if (this.product.galleryImages?.length) {
      return this.product.galleryImages;
    }

    return [this.product.image];
  }

  get activeImage(): string {
    const images = this.galleryImages;
    return images[this.activeImageIndex] || this.product?.image || '';
  }

  selectImage(index: number): void {
    this.activeImageIndex = index;
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.navCtrl.back();
    } else {
      this.router.navigate(['/products']);
    }
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  async toggleFavorite(): Promise<void> {
    if (!this.product) {
      return;
    }

    this.product.isFavorite = !this.product.isFavorite;
    const isFavorite = this.product.isFavorite;

    const message = isFavorite
      ? `Añadido a favoritos: ${this.product.name}`
      : `Eliminado de favoritos: ${this.product.name}`;

    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 1500,
        position: 'bottom',
        color: 'dark',
      });

      await toast.present();
    } catch {
      // Ignore toast presentation errors in tests
    }
  }

  async addToCart(): Promise<void> {
    if (!this.product) {
      return;
    }

    const result = await this.cartService.addItem(
      this.product,
      1,
      this.selectedSize || undefined,
    );
    this.cartCount = this.cartService.getCartCount();
    this.cdr.markForCheck();

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
}