import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
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
  questions: QuizQuestion[];
  estimatedTime: number;
  totalQuestions: number;
  createdBy: string;
  source: 'openai' | 'manual';
  category?: string;
  isPublic: boolean,
  approvalStatus: string,
  difficulty?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreateQuizesService {

  private quizDraftSubject$ = new Subject<Quiz | null>();
  private quizzesDraftSubject$ = new Subject<Quiz[]>();
  private quizzesPublishedSubject$ = new Subject<Quiz[]>();
  private activeQuizSubject$ = new Subject<Quiz | null>();
  private quizResultSubject$ = new Subject<{ correct: boolean, explanation?: string } | null>();

  constructor(private socketService: SocketService) { }

  createQuiz(prompt: string, options?: any): Observable<Quiz> {
    this.socketService.socket.emit('quiz:create', { prompt, options });

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:create:success').subscribe({
        next: (data) => {
          this.getAllQuiz().toPromise()
          this.quizDraftSubject$.next(data.quiz);
          this.getPublishedQuiz().toPromise()
          observer.next(data.quiz);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  getAllQuiz(): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:all');

    return new Observable<Quiz[]>(observer => {
      const subscription = this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:all:success').subscribe({
        next: (data) => {
          this.quizzesDraftSubject$.next(data.quizes);
          this.getPublishedQuiz().toPromise()
          observer.next(data.quizes);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  getPublishedQuiz(): Observable<Quiz[]> {
    this.socketService.socket.emit('quiz:published');

    return new Observable<Quiz[]>(observer => {
      const subscription = this.socketService.fromEvent<{ quizes: Quiz[] }>('quiz:published:success').subscribe({
        next: (data) => {
          this.quizzesPublishedSubject$.next(data.quizes);
          observer.next(data.quizes);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  getQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:get', quizId);

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:get:success').subscribe({
        next: (data) => {
          observer.next(data.quiz);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  updateQuizStatus(quizId: string, publish: boolean, approvalStatus: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:publish', quizId, publish, approvalStatus);

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:publish:success').subscribe({
        next: (data) => {
          this.getAllQuiz().toPromise()
          this.getPublishedQuiz().toPromise()
          observer.next(data['quiz']);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  generateNewQuestion(quizId: string, index: number): Observable<Quiz> {
    this.socketService.socket.emit('quiz:refreshQuestion', quizId, index);

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:refreshQuestion:success').subscribe({
        next: (data) => {
          observer.next(data.quiz);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  deleteQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:delete', quizId);

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:delete:success').subscribe({
        next: (data) => {
          this.getAllQuiz().toPromise()
          this.getPublishedQuiz().toPromise()
          observer.next(data.quiz);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  startQuiz(quizId: string): Observable<Quiz> {
    this.socketService.socket.emit('quiz:start', quizId);

    return new Observable<Quiz>(observer => {
      const subscription = this.socketService.fromEvent<{ quiz: Quiz }>('quiz:start:success').subscribe({
        next: (data) => {
          this.activeQuizSubject$.next(data.quiz);
          observer.next(data.quiz);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  submitAnswer(questionId: string, answer: string): Observable<{ correct: boolean, explanation?: string }> {
    if (!true) {
      return new Observable(observer => {
        observer.error('No active quiz');
        observer.complete();
      });
    }

    this.socketService.socket.emit('quiz:answer:submit', );

    return new Observable<{ correct: boolean, explanation?: string }>(observer => {
      const subscription = this.socketService.fromEvent<{ result: any }>('quiz:answer:result').subscribe({
        next: (data) => {
          this.quizResultSubject$.next(data.result);
          observer.next(data.result);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  getCurrentDraft(): Observable<Quiz | null> {
    return this.quizDraftSubject$.asObservable();
  }

  getQuizesDraft(): Observable<Quiz[]> {
    return this.quizzesDraftSubject$.asObservable();
  }

  getPublishedQuizes(): Observable<Quiz[]> {
    return this.quizzesPublishedSubject$.asObservable();
  }

  getActiveQuiz(): Observable<Quiz | null> {
    return this.activeQuizSubject$.asObservable();
  }

  getQuizResults(): Observable<{ correct: boolean, explanation?: string } | null> {
    return this.quizResultSubject$.asObservable();
  }

  clearDraft(): void {
    this.quizDraftSubject$.next(null);
  }

  endActiveQuiz(): void {
    this.activeQuizSubject$.next(null);
  }
}