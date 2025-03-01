import { TestBed } from '@angular/core/testing';

import { GoogleadsService } from './googleads.service';

describe('GoogleadsService', () => {
  let service: GoogleadsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleadsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
