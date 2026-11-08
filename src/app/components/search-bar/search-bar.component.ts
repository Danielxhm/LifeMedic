import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Search01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [HugeiconsIconComponent],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent {
  @Output() searchChange = new EventEmitter<string>();

  readonly Search01Icon = Search01Icon;
  query = '';

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.query = input.value;
    this.searchChange.emit(this.query);
  }
}
