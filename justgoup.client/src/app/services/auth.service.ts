import { Injectable } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = '/api/account';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  private handleAuthSuccess(response: any) {
    if (response && response.token) {
      localStorage.setItem('justgoup_token', response.token);
      localStorage.setItem('justgoup_username', response.username);
      localStorage.setItem('justgoup_role', response.role);
    }

  }

  logout() {
    localStorage.removeItem('justgoup_token');
    localStorage.removeItem('justgoup_username');
    localStorage.removeItem('justgoup_role');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('justgoup_token');

  }
}
