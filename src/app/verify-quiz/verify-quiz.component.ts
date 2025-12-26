import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CreateQuizesService, Quiz } from '../create-quizes.service';
import { ToasterService } from '../toaster.service';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { IonIcon, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-verify-quiz',
  templateUrl: './verify-quiz.component.html',
  standalone : false,
  styleUrls: ['./verify-quiz.component.scss']
})
export class VerifyQuizComponent implements OnInit {
  private quizSubject = new BehaviorSubject<Quiz | null>(null);
  quiz$: Observable<Quiz | null> = this.quizSubject.asObservable();
  loadingStates: { [key: number]: boolean } = {};
  isLoading = true;
  rejecting = false;
  approving = false;

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private toasterService: ToasterService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => this.quizService.getQuiz(params['id'])),
      tap(quiz => {
        this.quizSubject.next(quiz);
        this.isLoading = false;
        // Initialize loading states
        quiz.questions.forEach((_, index) => {
          this.loadingStates[index] = false;
        });
      }),
      catchError(err => {
        this.isLoading = false;
        this.toasterService.error('Failed to load quiz');
        console.error('Error loading quiz', err);
        return of(null);
      })
    ).subscribe();
  }


  isCorrectAnswer(questionIndex: number, option: string): boolean {
    const question = this.quizSubject.value?.questions[questionIndex];
    return question?.correctAnswer === option;
  }
  

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }

  refreshQuestion(quizId: string, index: number): void {
    if (!quizId || this.loadingStates[index]) return;

    this.loadingStates[index] = true;
    
    this.quizService.generateNewQuestion(quizId, index).pipe(
      tap(newQuestion => {
        const currentQuiz = this.quizSubject.value;
        if (currentQuiz) {
          const updatedQuestions:any = [...currentQuiz.questions];
          updatedQuestions[index] = newQuestion;
          this.quizSubject.next({
            ...currentQuiz,
            questions: updatedQuestions
          });
        }
      }),
      catchError(err => {
        this.toasterService.error('Failed to refresh question');
        console.error('Error refreshing question', err);
        return of(null);
      }),
      tap(() => {
        this.loadingStates[index] = false;
      })
    ).subscribe();
  }

  approveQuiz(quizId: string): void {
    if (this.approving) return;
    
    this.approving = true;
    this.quizService.updateQuizStatus(quizId, 'approved').pipe(
      tap(() => {
        this.toasterService.success('Quiz Approved');
        // Refresh the quiz data after approval
        return this.quizService.getQuiz(quizId);
      }),
      tap(updatedQuiz => {
        this.quizSubject.next(updatedQuiz);
        this.approving = false;
      }),
      catchError(err => {
        this.approving = false;
        this.toasterService.error('Approval failed');
        console.error('Approval failed', err);
        return of(null);
      })
    ).subscribe();
  }

  rejectQuiz(quizId: string): void {
    if (this.rejecting) return;
    
    this.rejecting = true;
    this.quizService.updateQuizStatus(quizId, 'rejected').pipe(
      tap(() => {
        this.toasterService.success('Quiz Rejected');
        // Refresh the quiz data after rejection
        return this.quizService.getQuiz(quizId);
      }),
      tap(updatedQuiz => {
        this.quizSubject.next(updatedQuiz);
        this.rejecting = false;
      }),
      catchError(err => {
        this.rejecting = false;
        this.toasterService.error('Rejection failed');
        console.error('Rejection failed', err);
        return of(null);
      })
    ).subscribe();
  }

  trackByQuestionId(index: number, question: any): string {
    return question._id || index.toString();
  }

  getQuestionLoadingState(index: number): boolean {
    return this.loadingStates[index] || false;
  }
}