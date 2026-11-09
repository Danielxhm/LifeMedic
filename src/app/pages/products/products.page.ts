import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import {
  Search01Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';
import { Product } from '../../components/product-card/product-card.component';
import { ProductsService } from '../../services/products.service';

export interface CategoryTab {
  id: string;
  name: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false,
})
export class ProductsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly productsService = inject(ProductsService);

  readonly Search01Icon = Search01Icon;
  readonly Cancel01Icon = Cancel01Icon;
  readonly SlidersHorizontalIcon = SlidersHorizontalIcon;
  readonly ChevronDownIcon = ChevronDownIcon;

  cartCount = 4;
  searchQuery = '';
  selectedCategoryId = 'all';
  selectedSort = 'destacados';
  isSortModalOpen = false;

  readonly categories: CategoryTab[] = [
    { id: 'all', name: 'Todos' },
    { id: 'dolor', name: 'Dolor y fiebre' },
    { id: 'estomago', name: 'Estómago' },
    { id: 'alergias', name: 'Alergias' },
    { id: 'primeros-auxilios', name: 'Primeros auxilios' },
    { id: 'cuidado', name: 'Cuidado de la piel' },
  ];

  readonly sortOptions = [
    { id: 'destacados', label: 'Destacados' },
    { id: 'precio-asc', label: 'Menor precio' },
    { id: 'precio-desc', label: 'Mayor precio' },
    { id: 'nombre-asc', label: 'Nombre A-Z' },
  ];

  products: Product[] = [];

  ngOnInit(): void {
    this.loadProducts();
  }

  ionViewWillEnter(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.products = this.productsService.getProducts();
    this.cartCount = this.productsService.getCartCount();
  }

  get totalProductsCount(): number {
    return this.products.length;
  }

  get selectedSortLabel(): string {
    const found = this.sortOptions.find((o) => o.id === this.selectedSort);
    return found ? found.label : 'Destacados';
  }

  get filteredProducts(): Product[] {
    let result = [...this.products];

    // Filter by Category
    if (this.selectedCategoryId !== 'all') {
      result = result.filter(
        (p) => p.categoryId === this.selectedCategoryId,
      );
    }

    // Filter by Search Query
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query)),
      );
    }

    // Sorting
    switch (this.selectedSort) {
      case 'precio-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'precio-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'nombre-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'destacados':
      default:
        result.sort((a, b) => a.id - b.id);
        break;
    }

    return result;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  toggleSortModal(): void {
    this.isSortModalOpen = !this.isSortModalOpen;
  }

  selectSort(sortId: string): void {
    this.selectedSort = sortId;
    this.isSortModalOpen = false;
  }

  async toggleFavorite(product: Product): Promise<void> {
    this.productsService.toggleFavorite(product.id);
    product.isFavorite = !product.isFavorite;
    const message = product.isFavorite
      ? `Añadido a favoritos: ${product.name}`
      : `Eliminado de favoritos: ${product.name}`;

    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }

  async addToCart(product: Product): Promise<void> {
    this.cartCount = this.productsService.addToCart(product.id);
    const toast = await this.toastCtrl.create({
      message: `¡${product.name} añadido al carrito!`,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
      buttons: [
        {
          text: 'Ver',
          handler: () => {
            this.router.navigate(['/cart']);
          },
        },
      ],
    });
    await toast.present();
  }
}
