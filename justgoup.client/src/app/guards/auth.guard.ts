import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const isAuthPage = route.data['isAuthPage'] === true;

    if (isAuthPage && isLoggedIn) {
// If the user is logged in and trying to access an auth page, redirect to home
      this.router.navigate(['/']);
      return false;
    }

    if (!isAuthPage && !isLoggedIn) {
// If the user is not logged in and trying to access a protected page, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
