import { Component, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/lazy';
import {
  Search01Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
  ChevronDownIcon,
} from '@hugeicons/core-free-icons';
import { Product } from '../../components/product-card/product-card.component';

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
export class ProductsPage {
  private readonly toastCtrl = inject(ToastController);

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

  products: Product[] = [
    {
      id: 1,
      brand: 'ADVIL',
      name: 'Osteo-Bi Flex Complex',
      price: 7.5,
      currency: 'USD',
      image: 'assets/images/osteo-biflex.jpg',
      badge: 'OFERTA',
      badgeType: 'green',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      isFavorite: false,
    },
    {
      id: 2,
      brand: 'TYLENOL',
      name: 'Tylenol PM Extra Strength',
      price: 6.5,
      currency: 'USD',
      image: 'assets/images/tylenol-pm.jpg',
      badge: 'MÁS VENDIDO',
      badgeType: 'dark',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      isFavorite: false,
    },
    {
      id: 3,
      brand: 'PEPTO-BISMOL',
      name: 'Pepto-Bismol',
      price: 5.25,
      currency: 'USD',
      image: 'assets/images/pepto-bismol.jpg',
      badge: 'ESENCIAL',
      badgeType: 'dark',
      category: 'Estómago',
      categoryId: 'estomago',
      isFavorite: false,
    },
    {
      id: 4,
      brand: 'BAND-AID',
      name: 'Apósitos Band-Aid',
      price: 4.0,
      currency: 'USD',
      image: 'assets/images/band-aid.jpg',
      badge: 'IMPERMEABLE',
      badgeType: 'green',
      category: 'Primeros auxilios',
      categoryId: 'primeros-auxilios',
      isFavorite: false,
    },
    {
      id: 5,
      brand: 'MURAD',
      name: 'Crema de Noche con Retinol',
      price: 25.0,
      currency: 'USD',
      image: 'assets/images/retinol.png',
      badge: 'OFERTA',
      badgeType: 'green',
      category: 'Cuidado de la piel',
      categoryId: 'cuidado',
      isFavorite: false,
    },
    {
      id: 6,
      brand: 'PROTECCIÓN DIARIA',
      name: 'Protector Solar FPS 50+',
      price: 14.5,
      currency: 'USD',
      image: 'assets/images/protector-solar.png',
      badge: 'PROTECCIÓN',
      badgeType: 'green',
      category: 'Cuidado de la piel',
      categoryId: 'cuidado',
      isFavorite: false,
    },
    {
      id: 7,
      brand: 'BAYER',
      name: 'Aspirina 500mg',
      price: 3.75,
      currency: 'USD',
      image: 'assets/images/aspirina.jpg',
      badge: 'MÁS VENDIDO',
      badgeType: 'dark',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      isFavorite: false,
    },
    {
      id: 8,
      brand: 'ALKA-SELTZER',
      name: 'Alka-Seltzer Efervescente',
      price: 4.5,
      currency: 'USD',
      image: 'assets/images/alka-seltzer.jpg',
      badge: 'ALIVIO RÁPIDO',
      badgeType: 'green',
      category: 'Estómago',
      categoryId: 'estomago',
      isFavorite: false,
    },
  ];

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
    this.cartCount += 1;
    const toast = await this.toastCtrl.create({
      message: `¡${product.name} añadido al carrito!`,
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
