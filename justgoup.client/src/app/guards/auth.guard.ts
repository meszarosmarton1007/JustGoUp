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

    // Ha be van jelentkezve ÉS újra a login/register oldalra akar menni -> Visszadobjuk a termekhez
    if (isLoggedIn && isAuthPage) {
      this.router.navigate(['/gyms']);
      return false;
    }

    // MEGJEGYZÉS: A /gyms oldalt mostantól szabadon engedjük mindenkinek, az ellenőrzést a gombok szintjén végezzük a HTML-ben!
    return true;
  }
}
