import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { Router } from '@angular/router';

@Injectable()
export class interceptorInterceptor implements HttpInterceptor {

  private loaderCount = 0; // 👉 Track active requests

  constructor(private readonly loaderService: LoaderService,private readonly router:Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Show loader when request starts
    this.showLoader();

    const token = localStorage.getItem('token');

    // Attach token if available
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle request and finalize loader management
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid, navigate to login page
          // localStorage.removeItem('token'); // Optional: Clear token
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.hideLoader();
      })
    );
  }

  private showLoader(): void {
    this.loaderCount++; // Increment on request start
    if (this.loaderCount === 1) {
      // First request, show the loader
      this.loaderService.showLoader();
    }
  }

  private hideLoader(): void {
    this.loaderCount--; // Decrement on request complete
    if (this.loaderCount === 0) {
      // No more requests, hide the loader
      this.loaderService.hideLoader();
    }
  }
}