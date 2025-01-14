import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../theme.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  onLogout() {
    this.authService.logout();
  }

  get isLightTheme() {
    return this.themeService.getTheme() === 'light';
  }

  toggleTheme() {
    const newTheme =
      this.themeService.getTheme() === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}
