import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../components/product-card/product-card.component';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly cartService = inject(CartService);

  readonly cartCount$: Observable<number> = this.cartService.cartCount$;

  private readonly products: Product[] = [
    {
      id: 1,
      brand: 'ADVIL',
      laboratory: 'SUIZOS ETICOS',
      name: 'Osteo-Bi Flex Complex X 60 Tabletas',
      price: 32.0,
      originalPrice: 40.0,
      discountPercent: 20,
      currency: 'USD',
      image: 'assets/images/osteo-biflex.png',
      galleryImages: [
        'assets/images/osteo-biflex.png',
        'assets/images/osteo-biflex.jpg',
      ],
      badge: 'OFERTA',
      badgeType: 'green',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      rating: 4.8,
      reviewsCount: 217,
      sizes: ['30ml', '100ml'],
      description:
        'Coadyudante en el mantenimiento de la función normal de las articulaciones..',
      inStock: true,
      stock: 8,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 2,
      brand: 'TYLENOL',
      laboratory: 'JOHNSON & JOHNSON',
      name: 'Tylenol PM Extra Strength',
      price: 6.5,
      originalPrice: 8.5,
      discountPercent: 23,
      currency: 'USD',
      image: 'assets/images/tylenol-pm.png',
      galleryImages: [
        'assets/images/tylenol-pm.png',
        'assets/images/tylenol-pm.jpg',
      ],
      badge: 'MÁS VENDIDO',
      badgeType: 'dark',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      rating: 4.9,
      reviewsCount: 342,
      sizes: ['24 Caplets', '50 Caplets'],
      description:
        'Alivio eficaz del dolor leve nocturno acompañado de insomnio para un descanso profundo y reparador.',
      inStock: true,
      stock: 15,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 3,
      brand: 'PEPTO-BISMOL',
      laboratory: 'PROCTER & GAMBLE',
      name: 'Pepto-Bismol Suspensión',
      price: 5.25,
      originalPrice: 6.5,
      discountPercent: 19,
      currency: 'USD',
      image: 'assets/images/pepto-bismol.jpg',
      galleryImages: ['assets/images/pepto-bismol.jpg'],
      badge: 'ESENCIAL',
      badgeType: 'dark',
      category: 'Estómago',
      categoryId: 'estomago',
      rating: 4.7,
      reviewsCount: 189,
      sizes: ['118ml', '236ml'],
      description:
        'Alivio rápido de 5 síntomas estomacales: acidez, indigestión, malestar estomacal, náuseas y diarrea.',
      inStock: true,
      stock: 10,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 4,
      brand: 'BAND-AID',
      laboratory: 'JOHNSON & JOHNSON',
      name: 'Apósitos Band-Aid Impermeables',
      price: 4.0,
      originalPrice: 5.0,
      discountPercent: 20,
      currency: 'USD',
      image: 'assets/images/band-aid.jpg',
      galleryImages: ['assets/images/band-aid.jpg'],
      badge: 'IMPERMEABLE',
      badgeType: 'green',
      category: 'Primeros auxilios',
      categoryId: 'primeros-auxilios',
      rating: 4.6,
      reviewsCount: 95,
      sizes: ['20 Unidades', '40 Unidades'],
      description:
        'Curitas adhesivas estériles e impermeables que sellan contra el agua, suciedad y bacterias.',
      inStock: true,
      stock: 20,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 5,
      brand: 'MURAD',
      laboratory: 'MURAD SKINCARE',
      name: 'Crema de Noche con Retinol',
      price: 25.0,
      originalPrice: 32.0,
      discountPercent: 22,
      currency: 'USD',
      image: 'assets/images/retinol.png',
      galleryImages: ['assets/images/retinol.png'],
      badge: 'OFERTA',
      badgeType: 'green',
      category: 'Cuidado de la piel',
      categoryId: 'piel',
      rating: 4.9,
      reviewsCount: 156,
      sizes: ['30ml', '50ml'],
      description:
        'Tratamiento intensivo regenerador antiedad que minimiza visiblemente arrugas y mejora el tono de la piel.',
      inStock: true,
      stock: 6,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 6,
      brand: 'HAWAIIAN TROPIC',
      laboratory: 'EDGEWELL PERSONAL CARE',
      name: 'Protector solar Silk Hydration FPS 50+',
      price: 14.5,
      originalPrice: 18.0,
      discountPercent: 19,
      currency: 'USD',
      image: 'assets/images/protector-solar.png',
      galleryImages: ['assets/images/protector-solar.png'],
      badge: 'POPULAR',
      badgeType: 'green',
      category: 'Cuidado de la piel',
      categoryId: 'piel',
      rating: 4.8,
      reviewsCount: 412,
      sizes: ['180ml', '240ml'],
      description:
        'Protección solar avanzada de amplio espectro UVA/UVB con cintas de seda hidratante por 12 horas.',
      inStock: true,
      stock: 12,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 7,
      brand: 'BAYER',
      laboratory: 'BAYER HEALTHCARE',
      name: 'Aspirina 500mg Efervescente',
      price: 3.5,
      originalPrice: 4.5,
      discountPercent: 22,
      currency: 'USD',
      image: 'assets/images/aspirina.jpg',
      galleryImages: ['assets/images/aspirina.jpg'],
      badge: 'CLÁSICO',
      badgeType: 'dark',
      category: 'Dolor y fiebre',
      categoryId: 'dolor',
      rating: 4.7,
      reviewsCount: 204,
      sizes: ['20 Tabletas', '40 Tabletas'],
      description:
        'Alivio analgésico y antipirético de rápida acción contra dolor de cabeza, dolor muscular y fiebre.',
      inStock: true,
      stock: 18,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
    {
      id: 8,
      brand: 'ALKA-SELTZER',
      laboratory: 'BAYER CONSUMER CARE',
      name: 'Alka-Seltzer Boost Efervescente',
      price: 4.75,
      originalPrice: 6.0,
      discountPercent: 20,
      currency: 'USD',
      image: 'assets/images/alka-seltzer.jpg',
      galleryImages: ['assets/images/alka-seltzer.jpg'],
      badge: 'ENERGÍA',
      badgeType: 'green',
      category: 'Estómago',
      categoryId: 'estomago',
      rating: 4.8,
      reviewsCount: 167,
      sizes: ['10 Tabletas', '30 Tabletas'],
      description:
        'Fórmula efervescente de rápida absorción que combate pesadez, indigestión ácida y fatiga.',
      inStock: true,
      stock: 14,
      freeShipping: true,
      inStoreAvailable: true,
      isFavorite: false,
    },
  ];

  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(id: number): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  toggleFavorite(productId: number): boolean {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.isFavorite = !product.isFavorite;
      return product.isFavorite;
    }
    return false;
  }

  addToCart(productId: number, quantity: number = 1, size?: string): number {
    const product = this.getProductById(productId);
    if (product) {
      this.cartService.addItem(product, quantity, size);
    }
    return this.cartService.getCartCount();
  }

  getCartCount(): number {
    return this.cartService.getCartCount();
  }
}
