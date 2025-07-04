import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token')
  if (!token) {
    router.createUrlTree(['/login']);
    return false
  }
  return true;
};

export const loginGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return true
  }
  return false;
};