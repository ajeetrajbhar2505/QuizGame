import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizesPage } from './quizes.page';

describe('QuizesPage', () => {
  let component: QuizesPage;
  let fixture: ComponentFixture<QuizesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuizesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
