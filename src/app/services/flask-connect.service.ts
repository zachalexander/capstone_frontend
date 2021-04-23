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

  dev = 'http://localhost:5000/'
  prod = 'https://cuny-capstone-backend.herokuapp.com/'


  getValues(): Observable <any> {
      return this.http.get(this.prod).pipe(map((response => response[0])));
  }

  postValues(value): Observable <any> {
    return this.http.post(this.prod + 'posts', value).pipe(map(response => response))
  }

  postCoords(coords): Observable <any> {
    return this.http.post(this.prod + 'coords', coords).pipe(map(response => response))
  }

  getFootage(address): Observable <any> {
    return this.http.get(this.prod + `square-feet/${address}`).pipe(map(response => response))
  }

  runModel(address): Observable <any> {
    return this.http.get(this.prod + `calc/${address}`).pipe(map(response => response))
  }
}
