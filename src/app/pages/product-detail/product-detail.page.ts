import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular/lazy';
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
import { ProductsService } from '../../services/products.service';

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
  private readonly productsService = inject(ProductsService);

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
  cartCount = 4;

  ngOnInit(): void {
    this.cartCount = this.productsService.getCartCount();
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : 1;
    this.loadProduct(id);
  }

  ionViewWillEnter(): void {
    this.cartCount = this.productsService.getCartCount();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadProduct(parseInt(idParam, 10));
    }
  }

  loadProduct(id: number): void {
    const found = this.productsService.getProductById(id);
    if (found) {
      this.product = found;
    } else {
      this.product = this.productsService.getProductById(1) || null;
    }

    if (this.product?.sizes && this.product.sizes.length > 0) {
      this.selectedSize = this.product.sizes[0];
    }
    this.activeImageIndex = 0;
  }

  get galleryImages(): string[] {
    if (!this.product) return [];
    if (this.product.galleryImages && this.product.galleryImages.length > 0) {
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
    this.router.navigate(['/products']);
  }

  async toggleFavorite(): Promise<void> {
    if (!this.product) return;
    const isFav = this.productsService.toggleFavorite(this.product.id);
    this.product.isFavorite = isFav;

    const message = isFav
      ? `Añadido a favoritos: ${this.product.name}`
      : `Eliminado de favoritos: ${this.product.name}`;

    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }

  async addToCart(): Promise<void> {
    if (!this.product) return;
    this.cartCount = this.productsService.addToCart(this.product.id);

    const toast = await this.toastCtrl.create({
      message: `¡${this.product.name} añadido al carrito!`,
      duration: 1800,
      position: 'bottom',
      color: 'dark',
      buttons: [
        {
          text: 'Ver',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }
}
