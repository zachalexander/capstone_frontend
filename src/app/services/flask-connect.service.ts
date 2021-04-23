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
  address: any;

  constructor(private http: HttpClient) { }

  getValues(): Observable <any> {
      return this.http.get('https://cuny-capstone-backend.herokuapp.com/').pipe(map((response => response[0])));
  }

  postValues(value): Observable <any> {
    return this.http.post('https://cuny-capstone-backend.herokuapp.com/posts', value).pipe(map(response => response))
  }

  postCoords(coords): Observable <any> {
    return this.http.post('https://cuny-capstone-backend.herokuapp.com/coords', coords).pipe(map(response => response))
  }

  getFootage(address): Observable <any> {
    return this.http.get(`https://cuny-capstone-backend.herokuapp.com/square-feet/${address}`).pipe(map(response => response))
  }

  runModel(address): Observable <any> {
    return this.http.get(`https://cuny-capstone-backend.herokuapp.com/calc/${address}`).pipe(map(response => response))
  }
}
