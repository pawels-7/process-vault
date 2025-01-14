import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import localePl from '@angular/common/locales/pl';

import { routes } from './app.routes';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { AuthService } from './auth/auth.service';
import { registerLocaleData } from '@angular/common';

export const API = 'https://process-vault.onrender.com';

const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.user()?.token;

  if (authToken) {
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', authToken),
    });
    return next(authRequest);
  }

  return next(req);
};

registerLocaleData(localePl);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pl-PL' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
