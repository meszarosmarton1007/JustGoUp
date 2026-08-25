import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WallService {
  
  private apiUrl = 'api/climbingwalls';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('justgoup_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }
  getWallsByGym(gymId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gym/${gymId}`);
  }

  
  createWall(wallFormData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, wallFormData, this.getAuthHeaders());
  }

  deleteWall(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

}
