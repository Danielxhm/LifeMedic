import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { FavouriteIcon, Add01Icon } from '@hugeicons/core-free-icons';

export interface Product {
  id: number;
  brand: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  badge?: string;
  badgeType?: 'green' | 'dark';
  category?: string;
  categoryId?: string;
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
  @Input({ required: true }) product!: Product;

  @Output() favoriteToggled = new EventEmitter<Product>();
  @Output() addedToCart = new EventEmitter<Product>();

  readonly FavouriteIcon = FavouriteIcon;
  readonly Add01Icon = Add01Icon;

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.product);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addedToCart.emit(this.product);
  }
}
