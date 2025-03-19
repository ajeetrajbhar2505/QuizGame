import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';

@Injectable()
export class interceptorInterceptor implements HttpInterceptor {

  private loaderCount = 0; // 👉 Track active requests

  constructor(private loaderService: LoaderService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Show loader when request starts
    this.showLoader();

    const token = localStorage.getItem('userId');

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