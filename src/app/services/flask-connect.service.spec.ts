import { TestBed } from '@angular/core/testing';

import { FlaskConnectService } from './flask-connect.service';

describe('FlaskConnectService', () => {
  let service: FlaskConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlaskConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
