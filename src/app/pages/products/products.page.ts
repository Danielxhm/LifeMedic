import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  Search01Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';
import { Product } from '../../components/product-card/product-card.component';
import { CatalogApiService } from '../../services/catalog-api.service';
import { CartService } from '../../services/cart.service';
import { extractApiErrorMessage } from '../../utils/api-error.util';

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
  private readonly cartService = inject(CartService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly Search01Icon = Search01Icon;
  readonly Cancel01Icon = Cancel01Icon;
  readonly SlidersHorizontalIcon = SlidersHorizontalIcon;
  readonly ChevronDownIcon = ChevronDownIcon;

  cartCount = this.cartService.getCartCount();
  searchQuery = '';
  selectedCategoryId = 'all';
  selectedSort = 'destacados';
  isSortModalOpen = false;
  catalogError = '';
  private skipNextEnterRefresh = false;

  categories: CategoryTab[] = [{ id: 'all', name: 'Todos' }];
  products: Product[] = [];

  readonly sortOptions = [
    { id: 'destacados', label: 'Destacados' },
    { id: 'precio-asc', label: 'Menor precio' },
    { id: 'precio-desc', label: 'Mayor precio' },
    { id: 'nombre-asc', label: 'Nombre A-Z' },
  ];

  ngOnInit(): void {
    this.skipNextEnterRefresh = true;

    this.cartService.cartCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.cartCount = count;
        this.cdr.markForCheck();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.searchQuery = params.get('search') ?? '';
        this.selectedCategoryId = params.get('categoryId') ?? 'all';
        this.cdr.markForCheck();
      });

    this.loadCatalog();
    this.loadCategories();
  }

  ionViewWillEnter(): void {
    this.isSortModalOpen = false;
    this.cartCount = this.cartService.getCartCount();

    if (this.skipNextEnterRefresh) {
      this.skipNextEnterRefresh = false;
      this.cdr.markForCheck();
      return;
    }

    this.loadCatalog();
    if (this.categories.length <= 1) {
      this.loadCategories();
    }
    this.cdr.markForCheck();
  }

  retryCatalogLoad(): void {
    this.loadCatalog();
    if (this.categories.length <= 1) {
      this.loadCategories();
    }
  }

  private loadCatalog(): void {
    this.catalogApi
      .getCatalogProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.catalogError = '';
          this.cartCount = this.cartService.getCartCount();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar productos de la API:', error);
          this.catalogError = extractApiErrorMessage(
            error,
            'No se pudieron cargar los productos.',
          );
          this.cdr.markForCheck();
        },
      });
  }

  private loadCategories(): void {
    this.catalogApi
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
          (product.laboratory?.toLowerCase().includes(query) ?? false) ||
          (product.codigo?.toLowerCase().includes(query) ?? false) ||
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
    this.cdr.markForCheck();
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  toggleSortModal(): void {
    this.isSortModalOpen = !this.isSortModalOpen;
    this.cdr.markForCheck();
  }

  selectSort(sortId: string): void {
    this.selectedSort = sortId;
    this.isSortModalOpen = false;
    this.cdr.markForCheck();
  }

  async toggleFavorite(product: Product): Promise<void> {
    product.isFavorite = !product.isFavorite;
    this.cdr.markForCheck();

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
    const result = await this.cartService.addItem(product, 1);
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
      // Ignore toast failure in tests
    }
  }
}