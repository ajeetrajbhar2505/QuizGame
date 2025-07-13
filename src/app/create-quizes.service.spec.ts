import { TestBed } from '@angular/core/testing';

import { CreateQuizesService } from './create-quizes.service';

describe('CreateQuizesService', () => {
  let service: CreateQuizesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateQuizesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
