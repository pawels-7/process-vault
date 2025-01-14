import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';
import { API } from '../app.config';

export interface AuthResponseData {
  email: string;
  token: string;
  localId: string;
  expiresIn: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  user = signal<User | null>(null);
  private tokenExpirationTimer: any;

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(`${API}/signup`, {
        email,
        password,
      })
      .pipe(
        catchError((errorRes) => this.handleError(errorRes)),
        tap((resData) =>
          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.token,
            +resData.expiresIn
          )
        )
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(`${API}/login`, {
        email,
        password,
      })
      .pipe(
        catchError((errorRes) => this.handleError(errorRes)),
        tap((resData) =>
          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.token,
            +resData.expiresIn
          )
        )
      );
  }

  autoLogin() {
    const userDataString = localStorage.getItem('userData');

    if (!userDataString) {
      return;
    }

    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(userDataString);

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate)
    );

    if (loadedUser.token) {
      this.user.set(loadedUser);
      const expirationDuration =
        new Date(userData._tokenExpirationDate).getTime() -
        new Date().getTime();
      console.log(
        new Date(userData._tokenExpirationDate).getTime() - new Date().getTime()
      );
      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.set(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.set(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'Coś poszło nie tak!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(() => new Error(errorMessage));
    }
    switch (errorRes.error.error.message) {
      case 'INVALID_PASSWORD':
        errorMessage = 'Wrong password!';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'Email not found!';
        break;
      case 'EMAIL_EXISTS':
        errorMessage = 'Email already exists!';
        break;
    }

    return throwError(() => new Error(errorMessage));
  }
}
