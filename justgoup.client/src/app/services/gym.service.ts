import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GymService {
  private apiUrl = '/api/climbinggyms';

  constructor(private http: HttpClient) { }


  private getAuthHeaders() {
    const token = localStorage.getItem('justgoup_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getGyms(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createGym(gymData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, gymData, this.getAuthHeaders());
  }

  updateGym(id: number, gymData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, gymData, this.getAuthHeaders());
  }

  deleteGym(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

}
