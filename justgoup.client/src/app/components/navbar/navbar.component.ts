import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode'; // <--- ÚJ IMPORT

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit(): void { }

  // --- RENDKÍVÜL BIZTONSÁGOS NÉVKIOLVASÓ ---
  // Közvetlenül a titkosított C# JWT tokenből fejti vissza a nevet, így nem számít a kis/nagybetűs hiba!
  getUserName(): string {
    const token = localStorage.getItem('justgoup_token');
    if (!token) return 'Vendég';

    try {
      const decoded: any = jwtDecode(token);
      // A .NET a nevet a 'unique_name' vagy 'name' kulcsba csomagolja a tokenen belül
      return decoded.unique_name || decoded.name || 'Felhasználó';
    } catch (error) {
      console.error('Hibás token formátum:', error);
      return 'Felhasználó';
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

