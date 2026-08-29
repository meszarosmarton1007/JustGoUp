import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = '/api/routecomments';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('justgoup_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getCommentsByRoute(routeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/route/${routeId}`);
  }

  addComment(commentData: { commentText: string, climbingRouteId: number, parentCommentId: number | null }): Observable<any> {
    return this.http.post<any>(this.apiUrl, commentData, this.getAuthHeaders());
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
