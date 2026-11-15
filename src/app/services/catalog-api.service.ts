import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../components/product-card/product-card.component';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoriesResponse {
  data: Category[];
}

interface ApiMedicine {
  id: number;
  category_id: number;
  category?: { name: string } | null;
  catalog_type?: 'medicine' | 'product';
  name: string;
  brand?: string | null;
  laboratory?: string | null;
  description?: string | null;
  price: string | number;
  stock: number;
  image_url?: string | null;
  created_at?: string;
}

interface MedicinesResponse {
  data: {
    data: ApiMedicine[];
  };
}

interface MedicineDetailResponse {
  data: ApiMedicine;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly backendUrl = this.apiUrl.replace(/\/api$/, '');

  getCategories(): Observable<Category[]> {
    return this.http
      .get<CategoriesResponse>(`${this.apiUrl}/categories`)
      .pipe(map((response) => response.data));
  }

  getHomeProducts(): Observable<Product[]> {
    return this.http
      .get<MedicinesResponse>(
        `${this.apiUrl}/v1/medicines?catalog_type=all&per_page=5`,
      )
      .pipe(
        map((response) =>
          response.data.data.map((medicine) => this.toProduct(medicine)),
        ),
      );
  }

  getCatalogProducts(): Observable<Product[]> {
    return this.http
      .get<MedicinesResponse>(
        `${this.apiUrl}/v1/medicines?catalog_type=all&per_page=100`,
      )
      .pipe(
        map((response) =>
          response.data.data.map((medicine) => this.toProduct(medicine)),
        ),
      );
  }

  getCatalogProductById(
    id: number,
    type: 'medicine' | 'product',
  ): Observable<Product> {
    const endpoint = type === 'product' ? 'products' : 'medicines';

    return this.http
      .get<MedicineDetailResponse>(`${this.apiUrl}/v1/${endpoint}/${id}`)
      .pipe(
        map(({ data }) => this.toProduct(data, type)),
      );
  }

  private toProduct(
    medicine: ApiMedicine,
    typeFallback: 'medicine' | 'product' = 'medicine',
  ): Product {
    return {
      id: medicine.id,
      brand: medicine.brand || medicine.laboratory || 'LifeMedic',
      laboratory: medicine.laboratory || undefined,
      name: medicine.name,
      price: Number(medicine.price),
      currency: 'USD',
      image: this.getImageUrl(medicine.image_url),
      description: medicine.description || undefined,
      category: medicine.category?.name,
      categoryId: String(medicine.category_id),
      catalogType: medicine.catalog_type ?? typeFallback,
      stock: medicine.stock,
      inStock: medicine.stock > 0,
      isFavorite: false,
      createdAt: medicine.created_at,
    };
  }

  private getImageUrl(imagePath?: string | null): string {
    if (!imagePath) {
      return 'assets/images/paracetamol.jpg';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    return `${this.backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
}