import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = '/api/climbingroutes';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('justgoup_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getRoutesByWall(wallId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/wall/${wallId}`);
  }

  getWallDetails(wallId: number): Observable<any> {
    return this.http.get<any>(`/api/climbingwalls/${wallId}`, this.getAuthHeaders());
  }

  createRoute(routeFormData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, routeFormData, this.getAuthHeaders());
  }

  updateRoute(id: number, routeFormData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, routeFormData, this.getAuthHeaders());
  }

  deleteRoute(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}

