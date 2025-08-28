import { TestBed } from '@angular/core/testing';

import { QuizGuardService } from './quiz-guard.service';

describe('QuizGuardService', () => {
  let service: QuizGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
