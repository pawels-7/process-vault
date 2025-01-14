import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme = 'dark';

  constructor() {
    this.loadTheme();
  }

  setTheme(theme: string) {
    document.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  getTheme(): string {
    return this.currentTheme;
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }
}
