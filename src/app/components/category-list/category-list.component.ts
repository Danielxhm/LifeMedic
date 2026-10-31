import { Component } from '@angular/core';

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
})
export class CategoryListComponent {
  categories: Category[] = [
    { id: 1, name: 'Fragancias' },
    { id: 2, name: 'Maquillaje' },
    { id: 3, name: 'Cabello' },
    { id: 4, name: 'Cuidado de la piel' },
    { id: 5, name: 'Protección solar' },
  ];

  selectedCategoryId: number | null = null;

  selectCategory(categoryId: number): void {
    this.selectedCategoryId =
      this.selectedCategoryId === categoryId ? null : categoryId;
  }

  viewAll(): void {
    this.selectedCategoryId = null;
  }
}