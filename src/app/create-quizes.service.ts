import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
import { filter, map, tap } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';

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
  questions: QuizQuestion[];
  estimatedTime: number;
  totalQuestions: number;
  createdBy: string;
  source: 'openai' | 'admin-template';
  category?: string;
  isPublic: boolean;
  approvalStatus: string;
  difficulty?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CreateQuizesService {
  // State Subjects
  private quizDraftSubject$ = new BehaviorSubject<Quiz | null>(null);
  private quizzesDraftSubject$ = new BehaviorSubject<Quiz[]>([]);
  private quizzesPublishedSubject$ = new BehaviorSubject<Quiz[]>([]);
  private activeQuizSubject$ = new BehaviorSubject<Quiz | null>(null);
  private quizResultSubject$ = new BehaviorSubject<{
    correct: boolean,
    explanation?: string,
    questionId?: string,
    selectedAnswer?: string
  } | null>(null);

  // Public Observables
  public getCurrentDraft$ = this.quizDraftSubject$.asObservable();
  public getQuizesDraft$ = this.quizzesDraftSubject$.asObservable();
  public getPublishedQuizes$ = this.quizzesPublishedSubject$.asObservable();
  public getActiveQuiz$ = this.activeQuizSubject$.asObservable();
  public getQuizResults$ = this.quizResultSubject$.asObservable();

  // Value getters for synchronous access
  get currentDraft(): Quiz | null {
    return this.quizDraftSubject$.value;
  }

  get draftQuizzes(): Quiz[] {
    return this.quizzesDraftSubject$.value;
  }

  get publishedQuizzes(): Quiz[] {
    return this.quizzesPublishedSubject$.value;
  }

  get activeQuiz(): Quiz | null {
    return this.activeQuizSubject$.value;
  }

  constructor(private socketService: SocketService, private router: Router) {
    this.setupSocketListeners();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Store current route without query params
        let limit = event.urlAfterRedirects.split('?')[0] == '/home' ? 3 : 0
        window.scroll()
        this.initializeData(limit);
      });
  }

  public initializeData(limit: number): void {
    // Load initial data
    this.getAllQuiz().subscribe();
    this.getPublishedQuiz(limit).subscribe();
  }

  private setupSocketListeners(): void {
    // Quiz list updates
    this.socketService.socket.on('quiz:all:success', (data: { quizes: Quiz[] }) => {
      this.quizzesDraftSubject$.next(data.quizes);
    });

    // Published quizzes updates
    this.socketService.socket.on('quiz:published:success', (data: { quizes: Quiz[] }) => {
      this.quizzesPublishedSubject$.next(data.quizes);
    });

    // Individual quiz updates
    this.socketService.socket.on('quiz:updated', (quiz: Quiz) => {
      this.updateQuizInState(quiz);
    });

    // Quiz deletion
    this.socketService.socket.on('quiz:deleted', (quizId: string) => {
      this.removeQuizFromState(quizId);
    });
  }

  private updateQuizInState(updatedQuiz: Quiz): void {
    // Update in drafts if exists
    const currentDrafts = this.quizzesDraftSubject$.value;
    const draftIndex = currentDrafts.findIndex(q => q._id === updatedQuiz._id);

    if (draftIndex >= 0) {
      const updatedDrafts = [...currentDrafts];
      updatedDrafts[draftIndex] = updatedQuiz;
      this.quizzesDraftSubject$.next(updatedDrafts);
    }

    // Update in published if exists
    const currentPublished = this.quizzesPublishedSubject$.value;
    const publishedIndex = currentPublished.findIndex(q => q._id === updatedQuiz._id);

    if (publishedIndex >= 0) {
      const updatedPublished = [...currentPublished];
      updatedPublished[publishedIndex] = updatedQuiz;
      this.quizzesPublishedSubject$.next(updatedPublished);
    }

    // Update active quiz if it's the one being updated
    if (this.activeQuiz?._id === updatedQuiz._id) {
      this.activeQuizSubject$.next(updatedQuiz);
    }

    // Update current draft if it's the one being updated
    if (this.currentDraft?._id === updatedQuiz._id) {
      this.quizDraftSubject$.next(updatedQuiz);
    }
  }

  private removeQuizFromState(quizId: string): void {
    // Remove from drafts
    this.quizzesDraftSubject$.next(
      this.draftQuizzes.filter(q => q._id !== quizId)
    );

    // Remove from published
    this.quizzesPublishedSubject$.next(
      this.publishedQuizzes.filter(q => q._id !== quizId)
    );

    // Clear active quiz if it's the one being deleted
    if (this.activeQuiz?._id === quizId) {
      this.activeQuizSubject$.next(null);
    }

    // Clear current draft if it's the one being deleted
    if (this.currentDraft?._id === quizId) {
      this.quizDraftSubject$.next(null);
    }
  }

  // Public API Methods
  createQuiz(prompt: string, options?: any): Observable<Quiz> {
    this.socketService.socket.emit('quiz:create', { prompt, options });

    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:create:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        this.quizDraftSubject$.next(quiz);
        // Refresh lists
        this.getAllQuiz().subscribe();
        this.getPublishedQuiz(0).subscribe();
      })
    );
  }

  getAllQuiz(): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:all');
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:all:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.quizzesDraftSubject$.next(quizzes))
    );
  }

  getPublishedQuiz(limit: number): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:published', limit);
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:published:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.quizzesPublishedSubject$.next(quizzes))
    );
  }

  getQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:get', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:get:success').pipe(
      map(data => data.quiz)
    );
  }

  updateQuizStatus(quizId: string, publish: boolean, approvalStatus: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:publish', quizId, publish, approvalStatus);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:publish:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        // The socket listeners will handle the state updates
        this.getAllQuiz().subscribe();
        this.getPublishedQuiz(0).subscribe();
      })
    );
  }

  generateNewQuestion(quizId: string, index: number): Observable<Quiz> {
    this.socketService.socket.emit('quiz:refreshQuestion', quizId, index);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:refreshQuestion:success').pipe(
      map(data => data.quiz),
      tap(quiz => this.updateQuizInState(quiz))
    );
  }

  deleteQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:delete', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:delete:success').pipe(
      map(data => data.quiz),
      tap(() => {
        // The socket listeners will handle the state updates
        this.getAllQuiz().subscribe();
        this.getPublishedQuiz(0).subscribe();
      })
    );
  }

  startQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:start', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:start:success').pipe(
      map(data => data.quiz),
      tap(quiz => this.activeQuizSubject$.next(quiz))
    );
  }

  submitAnswer(questionId: string, answer: string): Observable<{
    correct: boolean,
    explanation?: string,
    questionId?: string,
    selectedAnswer?: string
  }> {
    if (!this.activeQuiz) {
      throw new Error('No active quiz');
    }

    this.socketService.socket.emit('quiz:answer:submit', {
      quizId: this.activeQuiz._id,
      questionId,
      answer
    });

    return this.socketService.fromEvent<{ result: any }>('quiz:answer:result').pipe(
      map(data => data.result),
      tap(result => this.quizResultSubject$.next(result))
    );
  }

  clearDraft(): void {
    this.quizDraftSubject$.next(null);
  }

  endActiveQuiz(): void {
    this.activeQuizSubject$.next(null);
    this.quizResultSubject$.next(null);
  }

  // Helper method to find a quiz by ID
  findQuizById(id: string): Quiz | undefined {
    return [...this.draftQuizzes, ...this.publishedQuizzes].find(q => q._id === id);
  }
}