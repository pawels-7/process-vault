import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="lds-ripple">
      <div></div>
      <div></div>
    </div>
  `,
  styleUrl: './loading-spinner.component.scss',
  standalone: true,
})
export class LoadingSpinnerComponent {}
