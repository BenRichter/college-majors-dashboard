import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Query {
  measures?: string[],
  dimensions?: string[],
  order?: object,
  filters?: object[],
  limit?: number
}
@Injectable({
  providedIn: 'root'
})
class CollegeMajorsCubeService {
  constructor(private http: HttpClient) { }

  load(query: Query): Observable<object[]> {
    return this.http.post<{ query: Query, data: object[] }>(`${environment.cubeJSAPI}/load`, { query })
      .pipe(
        map(resp => resp.data)
      );
  }
}

export { Query, CollegeMajorsCubeService };