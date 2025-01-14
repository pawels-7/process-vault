import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthResponseData, AuthService } from './auth.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  isLoginMode = signal(true);
  isLoading = signal(false);
  error = signal<string | null>(null);

  onSwitchMode(e: Event) {
    e.preventDefault();
    this.isLoginMode.set(!this.isLoginMode());
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }

    const email = form.value.email;
    const password = form.value.password;

    let authObs: Observable<AuthResponseData> = new Observable();

    this.isLoading.set(true);
    if (this.isLoginMode()) {
      authObs = this.authService.login(email, password);
    } else {
      authObs = this.authService.signup(email, password);
    }

    authObs.subscribe({
      next: (resData) => {
        console.log(resData);
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (errorMessage) => {
        console.log(errorMessage);
        this.error.set(errorMessage);
        this.isLoading.set(false);
      },
    });

    form.reset();
  }
}
