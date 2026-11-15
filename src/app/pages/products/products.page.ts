import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/lazy';
import {
  Search01Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';
import { Product } from '../../components/product-card/product-card.component';
import { CatalogApiService } from '../../services/catalog-api.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly toastCtrl = inject(ToastController);
  private readonly productsService = inject(ProductsService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly Search01Icon = Search01Icon;
  readonly Cancel01Icon = Cancel01Icon;
  readonly SlidersHorizontalIcon = SlidersHorizontalIcon;
  readonly ChevronDownIcon = ChevronDownIcon;

  cartCount = 4;
  searchQuery = '';
  selectedCategoryId = 'all';
  selectedSort = 'destacados';
  isSortModalOpen = false;

  categories: CategoryTab[] = [{ id: 'all', name: 'Todos' }];
  products: Product[] = [];

  readonly sortOptions = [
    { id: 'destacados', label: 'Destacados' },
    { id: 'precio-asc', label: 'Menor precio' },
    { id: 'precio-desc', label: 'Mayor precio' },
    { id: 'nombre-asc', label: 'Nombre A-Z' },
  ];

  ngOnInit(): void {
    this.searchQuery =
      this.route.snapshot.queryParamMap.get('search') ?? '';

    this.selectedCategoryId =
      this.route.snapshot.queryParamMap.get('categoryId') ?? 'all';

    this.catalogApi.getCatalogProducts().subscribe({
      next: (products) => {
        console.log('Productos recibidos de la API:', products.length, products);
        this.products = products;
        this.cartCount = this.productsService.getCartCount();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos de la API:', error);
      },
    });

    this.catalogApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = [
          { id: 'all', name: 'Todos' },
          ...categories.map((category) => ({
            id: String(category.id),
            name: category.name,
          })),
        ];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
    });
  }

  get totalProductsCount(): number {
    return this.products.length;
  }

  get selectedSortLabel(): string {
    const found = this.sortOptions.find(
      (option) => option.id === this.selectedSort,
    );

    return found ? found.label : 'Destacados';
  }

  get filteredProducts(): Product[] {
    let result = [...this.products];

    if (this.selectedCategoryId !== 'all') {
      result = result.filter(
        (product) => product.categoryId === this.selectedCategoryId,
      );
    }

    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          (product.category?.toLowerCase().includes(query) ?? false),
      );
    }

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
      default:
        result.sort((a, b) => a.id - b.id);
    }

    return result;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
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