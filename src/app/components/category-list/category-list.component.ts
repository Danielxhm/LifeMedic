import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  CatalogApiService,
  Category,
} from '../../services/catalog-api.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
})
export class CategoryListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  categories: Category[] = [];
  selectedCategoryId: number | null = null;

  ngOnInit(): void {
    this.catalogApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('No se pudieron cargar las categorías:', error);
      },
    });
  }

  selectCategory(categoryId: number): void {
    this.router.navigate(['/products'], {
      queryParams: { categoryId: String(categoryId) },
    });
  }

  viewAll(): void {
    this.selectedCategoryId = null;
    this.router.navigate(['/products']);
  }
}