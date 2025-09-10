import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { SocketService } from './socket.service';
import { map, tap } from 'rxjs/operators';
import { ToasterService } from './toaster.service';
import { Router } from '@angular/router';

export interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  isloading?:boolean
}

export interface userSubmissionStatus {
  isSubmitted : boolean,
  score : number,
  status : 'in-progress' | 'completed'
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
  approvalStatus: string;
  difficulty?: any;
  participants?:any[],
  status?:any,
  quizId?:any,
  isLive?:boolean,
  participantCount?:number
  host?:any,
  totalPoints:number,
  isParticipant:boolean,
  shuffleQuestions?:boolean,
  shuffleOptions?:boolean,
  userSubmissionStatus : userSubmissionStatus
}

@Injectable({
  providedIn: 'root'
})
export class CreateQuizesService {
  // State Subjects
  private quizDraftSubject$ = new BehaviorSubject<Quiz | null>(null);
  private quizzesDraftSubject$ = new BehaviorSubject<Quiz[]>([]);
  private quizzesPublishedSubject$ = new BehaviorSubject<Quiz[]>([]);
  private quizzesParticipantsSubject$ = new BehaviorSubject<Quiz | null>(null);
  private activeQuizSubject$ = new BehaviorSubject<Quiz | null>(null);
  private liveQuizesSubject$ = new BehaviorSubject<Quiz[]>([]);
  private submittedQuizesSubject$ = new BehaviorSubject<Quiz[]>([]);
  private quizResultSubject$ = new BehaviorSubject<{
    correct: boolean,
    explanation?: string,
    questionId?: string,
    selectedAnswer?: string
  } | null>(null);
  private refreshedQuizes$ = new BehaviorSubject<true | null>(null);
  isQuizesRefreshed = this.refreshedQuizes$.asObservable();

  // Public Observables
  public getCurrentDraft$ = this.quizDraftSubject$.asObservable();
  public getQuizesDraft$ = this.quizzesDraftSubject$.asObservable();
  public getPublishedQuizes$ = this.quizzesPublishedSubject$.asObservable();
  public getActiveQuiz$ = this.activeQuizSubject$.asObservable();
  public liveQuizes$ = this.liveQuizesSubject$.asObservable();
  public submittedQuizes$ = this.submittedQuizesSubject$.asObservable();
  public getQuizResults$ = this.quizResultSubject$.asObservable();
  public getParticipants$ = this.quizzesParticipantsSubject$.asObservable();

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

  constructor(private socketService: SocketService,private toastr:ToasterService,private router:Router) {
    this.setupSocketListeners();
  }

  async initializeData() {
    // Load initial data
    await forkJoin([
      this.getAllQuiz().toPromise(),
      this.getActiveQuizes().toPromise(),
      this.getPublishedQuiz().toPromise()
    ]).toPromise()

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

    // error listners
    this.socketService.socket.on('quiz:create:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:refreshQuestion:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:published:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:all:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:active:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:get:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:delete:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:publish:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:waiting:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:join:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:start:error', (data) => {
      this.toastr.success(data.error)
    });
    this.socketService.socket.on('quiz:submit:error', (data) => {
      this.toastr.success(data.error)
    });

    this.socketService.socket.on('quiz:answer:error', (data) => {
      this.toastr.success(data.error)
    });

    this.socketService.socket.on('refreshpage', (data) => {
      this.refreshedQuizes$.next(true)
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
        this.getPublishedQuiz().subscribe();
      })
    );
  }

  get limit(): number {
    let isLimitRoute = ['/home'].includes(this.router.url);
    return isLimitRoute ? 3 : 0;
  }

  getAllQuiz(): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:all');
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:all:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.quizzesDraftSubject$.next(quizzes))
    );
  }

  getPublishedQuiz(limit?:number): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:published', limit == 0 ? limit : this.limit);
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:published:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.quizzesPublishedSubject$.next(quizzes))
    );
  }

  getActiveQuizes(limit?:number): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:active',  limit == 0 ? limit : this.limit);
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:active:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.liveQuizesSubject$.next(quizzes))
    );
  }

  getSubmittedQuizes(): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:SubmittedQuizes');
    return this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:SubmittedQuizes:success').pipe(
      map(data => data.quizes),
      tap(quizzes => this.submittedQuizesSubject$.next(quizzes))
    );
  }

  getQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:get', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:get:success').pipe(
      map(data => data.quiz)
    );
  }

  getLiveQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('livequiz:get', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('livequiz:get:success').pipe(
      map(data => data.quiz)
    );
  }

  updateQuizStatus(quizId: string, approvalStatus: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:publish', quizId, approvalStatus);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:publish:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        // The socket listeners will handle the state updates
        this.getAllQuiz().subscribe();
        this.getPublishedQuiz().subscribe();
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
        this.refreshedQuizes$.next(true)
      })
    );
  }

  BeginQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:waiting', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:waiting:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        this.refreshedQuizes$.next(true)
      })
    );
  }

  joinQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:join', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:join:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        this.activeQuizSubject$.next(quiz),
        this.refreshedQuizes$.next(true)
      })
    );
  }

  startQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:start', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:start:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        this.refreshedQuizes$.next(true)
      })
    );
  }

  submitQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:submit', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:submit:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
      this.toastr.success('Quiz submitted successfully!');
        this.refreshedQuizes$.next(true)
      })
    );
  }

  completeQuizByHost(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:completeQuizByHost', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:completeQuizByHost:success').pipe(
      map(data => data.quiz),
      tap(quiz => {
        this.refreshedQuizes$.next(true)
        this.getAllQuiz().subscribe();
        this.getPublishedQuiz().subscribe();
        this.getActiveQuizes().subscribe()
      })
    );
  }


  getQuizParticipant(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:participants', quizId);
    return this.socketService.fromEvent<{ quiz: Quiz }>('quiz:participants:success').pipe(
      map(data => data.quiz),
      tap(quiz => this.quizzesParticipantsSubject$.next(quiz))
    );
  }

  submitAnswer(quizId:string,questionId: string | any, answer: string): Observable<{
    correctAnswer:string,
    isCorrect: boolean,
    points?: number,
    currentScore?: number,
  }> {
    if (!quizId) {
      throw new Error('No active quiz');
    }

    this.socketService.socket.emit('quiz:answer:submit', {
      quizId: quizId,
      questionId,
      answer
    });

    return this.socketService.fromEvent<{ result: any }>('quiz:answer:success').pipe(
      map(data => data.result),
      tap(result => {
        return result
      })
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