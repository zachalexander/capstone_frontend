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
      return this.http.get('https://cuny-capstone-backend.herokuapp.com/').pipe(map((response => response[0])));
  }

  postValues(value): Observable <any> {
    return this.http.post('https://cuny-capstone-backend.herokuapp.com/posts', value).pipe(map(response => response))
  }

  postCoords(coords): Observable <any> {
    return this.http.post('https://cuny-capstone-backend.herokuapp.com/coords', coords).pipe(map(response => response))
  }

  getScrapedData(address): Observable <any> {
    return this.http.get(`https://cuny-capstone-backend.herokuapp.com/scraped-data/${address}`).pipe(map(response => response))
  }

  runModel(address): Observable <any> {
    return this.http.get(`http://localhost:5000/calc/${address}`).pipe(map(response => response))
  }
}
