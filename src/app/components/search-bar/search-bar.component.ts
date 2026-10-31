import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent {
  @Output() searchChange = new EventEmitter<string>();

  query = '';

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.query = input.value;
    this.searchChange.emit(this.query);
  }
}