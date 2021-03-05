import { Injectable } from '@angular/core';
import { Observable, of,} from 'rxjs'
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

@Injectable()

export class FlaskConnectService {

  value: any;

  constructor(private http: HttpClient) { }

  getValues(): Observable <any> {
      return this.http.get('http://localhost:5000/').pipe(map((response => response[0])));
  }

  postValues(value): Observable <any> {
    return this.http.post('http://localhost:5000/posts', value).pipe(map(response => response))
}
}
