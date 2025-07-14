import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from './socket.service';

export interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  estimatedTime: number;
  totalQuestions: number;
  createdBy: string;
  source: 'openai' | 'manual';
  category?: string;
  isPublic: boolean;
  approvalStatus: string;
  difficulty?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreateQuizesService implements OnDestroy {
  // State subjects
  private quizDraft$ = new BehaviorSubject<Quiz | null>(null);
  private quizesDraft$ = new BehaviorSubject<Quiz[]>([]);
  private quizesPublished$ = new BehaviorSubject<Quiz[]>([]);
  private activeQuiz$ = new BehaviorSubject<Quiz | null>(null);
  private quizResult$ = new BehaviorSubject<{ correct: boolean, explanation?: string } | null>(null);
  
  // Socket subscriptions
  private socketSubscriptions: Subscription[] = [];

  constructor(private socketService: SocketService) { 
    this.initializeSocketListeners();
    this.fetchInitialData();
  }

  ngOnDestroy(): void {
    this.cleanupSocketListeners();
  }

  /* =============== SOCKET MANAGEMENT =============== */
  
  private initializeSocketListeners(): void {
    // Quiz creation and updates
    this.socketSubscriptions.push(
      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:create:success').subscribe(data => {
        this.quizDraft$.next(data.quiz);
        this.fetchAllQuizzes();
      }),

      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:update:success').subscribe(data => {
        this.updateQuizInLists(data.quiz);
      }),

      // Quiz lists
      this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:all:success').subscribe(data => {
        this.quizesDraft$.next(data.quizes);
      }),

      this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:published:success').subscribe(data => {
        this.quizesPublished$.next(data.quizes);
      }),

      // Quiz status changes
      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:publish:success').subscribe(data => {
        this.updateQuizInLists(data.quiz);
      }),

      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:delete:success').subscribe(data => {
        this.removeQuizFromLists(data.quiz._id);
      }),

      // Quiz taking
      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:start:success').subscribe(data => {
        this.activeQuiz$.next(data.quiz);
      }),

      this.socketService.fromEvent<{ result: any }>('quiz:answer:result').subscribe(data => {
        this.quizResult$.next(data.result);
      }),

      // Real-time updates
      this.socketService.fromEvent<{ quiz: Quiz }>('quiz:updated').subscribe(data => {
        this.updateQuizInLists(data.quiz);
      })
    );
  }

  private cleanupSocketListeners(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    this.socketSubscriptions = [];
  }

  private fetchInitialData(): void {
    this.fetchAllQuizzes();
    this.fetchPublishedQuizzes();
  }

  /* =============== STATE MANAGEMENT =============== */

  private updateQuizInLists(updatedQuiz: Quiz): void {
    // Update draft list
    const currentDrafts = this.quizesDraft$.value;
    const draftIndex = currentDrafts.findIndex(q => q._id === updatedQuiz._id);
    if (draftIndex >= 0) {
      currentDrafts[draftIndex] = updatedQuiz;
      this.quizesDraft$.next([...currentDrafts]);
    }

    // Update published list
    const currentPublished = this.quizesPublished$.value;
    const publishedIndex = currentPublished.findIndex(q => q._id === updatedQuiz._id);
    if (publishedIndex >= 0) {
      currentPublished[publishedIndex] = updatedQuiz;
      this.quizesPublished$.next([...currentPublished]);
    }

    // Update active quiz if needed
    if (this.activeQuiz$.value?._id === updatedQuiz._id) {
      this.activeQuiz$.next(updatedQuiz);
    }
  }

  private removeQuizFromLists(quizId: string): void {
    // Remove from draft list
    this.quizesDraft$.next(
      this.quizesDraft$.value.filter(q => q._id !== quizId)
    );

    // Remove from published list
    this.quizesPublished$.next(
      this.quizesPublished$.value.filter(q => q._id !== quizId)
    );

    // Clear active quiz if needed
    if (this.activeQuiz$.value?._id === quizId) {
      this.activeQuiz$.next(null);
    }
  }

  /* =============== PUBLIC API =============== */

  // Quiz Creation and Management
  createQuiz(prompt: string, options?: any): void {
    this.socketService.socket.emit('quiz:create', { prompt, options });
    this.fetchInitialData()
  }

  updateQuiz(quizId: string, updates: Partial<Quiz>): void {
    this.socketService.socket.emit('quiz:update', { quizId, updates });
  }

  deleteQuiz(quizId: string): void {
    this.socketService.socket.emit('quiz:delete', quizId);
    this.fetchInitialData()
  }

  // Quiz Status Management
  updateQuizStatus(quizId: string, publish: boolean, approvalStatus: string): void {
    this.socketService.socket.emit('quiz:publish', quizId, publish, approvalStatus);
  }

  // Quiz Taking
  startQuiz(quizId: string): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.socketService.socket.emit('quiz:start', quizId);

      const subscription = this.activeQuiz$.subscribe(quiz => {
        if (quiz?._id === quizId) {
          observer.next(quiz);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  submitAnswer(questionId: string, answer: string): Observable<{ correct: boolean, explanation?: string }> {
    const quizId = this.activeQuiz$.value?._id;
    if (!quizId) {
      return new Observable(observer => {
        observer.error('No active quiz');
        observer.complete();
      });
    }

    this.socketService.socket.emit('quiz:answer:submit', { quizId, questionId, answer });

    return new Observable<{ correct: boolean, explanation?: string }>(observer => {
      const subscription = this.quizResult$.subscribe(result => {
        if (result) {
          observer.next(result);
          observer.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  // Data Fetching
  private fetchAllQuizzes(): void {
    this.socketService.socket.emit('quiz:all');
  }

  private fetchPublishedQuizzes(): void {
    this.socketService.socket.emit('quiz:published');
  }

  getQuiz(quizId: string): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      // First check if we already have the quiz in state
      const allQuizzes = [...this.quizesDraft$.value, ...this.quizesPublished$.value];
      const existingQuiz = allQuizzes.find(q => q._id === quizId);
      
      if (existingQuiz) {
        observer.next(existingQuiz);
        observer.complete();
        return;
      }

      // If not found, fetch from server
      this.socketService.socket.emit('quiz:get', quizId);

      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:get:success')
        .subscribe({
          next: (data) => {
            if (data.quiz._id === quizId) {
              observer.next(data.quiz);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
            observer.complete();
          }
        });

      return () => subscription.unsubscribe();
    });
  }

  // Question Management
  generateNewQuestion(quizId: string, index: number): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.socketService.socket.emit('quiz:refreshQuestion', quizId, index);

      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:refreshQuestion:success')
        .subscribe({
          next: (data) => {
            if (data.quiz._id === quizId) {
              observer.next(data.quiz);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
            observer.complete();
          }
        });

      return () => subscription.unsubscribe();
    });
  }

  /* =============== STATE OBSERVABLES =============== */

  getCurrentDraft(): Observable<Quiz | null> {
    return this.quizDraft$.asObservable();
  }

  getQuizesDraft(): Observable<Quiz[]> {
    return this.quizesDraft$.asObservable();
  }

  getPublishedQuizes(): Observable<Quiz[]> {
    return this.quizesPublished$.asObservable();
  }

  getActiveQuiz(): Observable<Quiz | null> {
    return this.activeQuiz$.asObservable();
  }

  getQuizResults(): Observable<{ correct: boolean, explanation?: string } | null> {
    return this.quizResult$.asObservable();
  }

  /* =============== UTILITY METHODS =============== */

  clearDraft(): void {
    this.quizDraft$.next(null);
  }

  endActiveQuiz(): void {
    this.activeQuiz$.next(null);
    this.quizResult$.next(null);
  }
}