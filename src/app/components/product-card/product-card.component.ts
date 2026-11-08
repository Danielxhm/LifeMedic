import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { FavouriteIcon, Add01Icon } from '@hugeicons/core-free-icons';

export interface Product {
  id: number;
  brand: string;
  laboratory?: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  image: string;
  galleryImages?: string[];
  badge?: string;
  badgeType?: 'green' | 'dark';
  category?: string;
  categoryId?: string;
  rating?: number;
  reviewsCount?: number;
  sizes?: string[];
  description?: string;
  inStock?: boolean;
  freeShipping?: boolean;
  inStoreAvailable?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductCardComponent {
  private readonly router = inject(Router);

  @Input({ required: true }) product!: Product;

  @Output() cardClicked = new EventEmitter<Product>();
  @Output() favoriteToggled = new EventEmitter<Product>();
  @Output() addedToCart = new EventEmitter<Product>();

  readonly FavouriteIcon = FavouriteIcon;
  readonly Add01Icon = Add01Icon;

  onCardClick(): void {
    this.cardClicked.emit(this.product);
    this.router.navigate(['/products', this.product.id]);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.product);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addedToCart.emit(this.product);
  }
}
