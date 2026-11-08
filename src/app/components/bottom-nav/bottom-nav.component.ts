import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Home01Icon,
  GridViewIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HugeiconsIconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BottomNavComponent {
  readonly Home01Icon = Home01Icon;
  readonly GridViewIcon = GridViewIcon;
  readonly UserIcon = UserIcon;

  onNavClick(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    target?.blur();
  }
}
