import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, Subscription, of, Subject } from 'rxjs';
import { switchMap, tap, catchError, map, take } from 'rxjs/operators';
import { CreateQuizesService, Quiz, QuizQuestion } from '../create-quizes.service';
import { ComponentCanDeactivate } from '../quiz-guard.service';
import { AuthData, SocketService } from '../socket.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-ongoing',
  templateUrl: './ongoing.component.html',
  styleUrls: ['./ongoing.component.scss'],
})
export class OngoingComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  private quizSubject = new BehaviorSubject<Quiz | null>(null);
  quiz$: Observable<Quiz | null> = this.quizSubject.asObservable();
  quizId: string = "";
  currentQuestionIndex: number = 0;
  selectedOptions: number[] = [];
  remainingTime: number = 0;
  timerInterval: any;
  isAdminUser: boolean = false;
  isLoading: boolean = false
  private loadingStates: boolean[] = [];
  isQuizActive: boolean = false;
  private routeChangeSubscription!: Subscription;
  private deactivateSubject: Subject<boolean> | null = null;
  confirmationPopup: boolean = false

  // State management for loading and actions

  // Quiz data subscription
  private quizSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private quizService: CreateQuizesService,
    private location: Location,
    private router:Router,
    private SocketService: SocketService
  ) {
    this.isQuizActive = true;
    this.SocketService.authDataSource.next(null);
    // Replace current history state with home to prevent back navigation
    this.location.replaceState('/home');

  }

  ngOnInit() {

    this.route.queryParams.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => this.quizService.getLiveQuiz(params['id'])),
      tap(quiz => {

        // Initialize loading states for each question
        this.quizSubject.next(quiz);
        this.isLoading = false;

        // Initialize selected options array
        this.selectedOptions = new Array(quiz.questions.length).fill(null);

        // Start timer if quiz is in progress (not in admin preview mode)
        if (!this.isAdminUser || quiz.approvalStatus !== 'pending') {
          this.startTimer(quiz.estimatedTime);
        }
      }),
      catchError(err => {
        this.isLoading = false;
        console.error('Error loading quiz', err);
        return of(null);
      })
    ).subscribe();



  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.quizSubscription) {
      this.quizSubscription.unsubscribe();
    }
    if (this.routeChangeSubscription) {
      this.routeChangeSubscription.unsubscribe();
    }
    if (this.deactivateSubject) {
      this.deactivateSubject.complete();
      this.deactivateSubject = null;
    }
  }

  canDeactivate(): Observable<boolean> {
    if (!this.isQuizActive) {
      return of(true);
    }

    this.confirmationPopup = true;
    this.deactivateSubject = new Subject<boolean>();

    return this.deactivateSubject.asObservable().pipe(
      map(response => {
        this.confirmationPopup = false;
        if (response) {
          this.cleanupQuiz(); // Only cleanup if user chooses to leave
        }
        return response;
      })
    );
  }

  stayInQuiz() {
    if (this.deactivateSubject) {
      this.confirmationPopup = false;
      this.deactivateSubject.next(false);
      this.deactivateSubject.complete();
      this.deactivateSubject = null;
    }
    this.location.replaceState('/home');
  }

  leaveQuiz() {
 
    this.router.navigate(['/home'], { replaceUrl: true });

    // DON'T navigate here - let the router handle it!
  }

  private cleanupQuiz() {
    this.isQuizActive = false;
    let AuthData: AuthData = {
      token: localStorage.getItem('token') || '',
      user: JSON.parse(localStorage.getItem('user') || '{}')
    };
    this.SocketService.authDataSource.next(AuthData);
  }

  // Handle browser events (closing tab, refreshing page)
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.isQuizActive) {
      $event.returnValue = 'You have an active quiz. Are you sure you want to leave?';
    }
  }

  // Timer implementation
  startTimer(estimatedTime: number) {
    this.remainingTime = estimatedTime;

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        clearInterval(this.timerInterval);
        this.isQuizActive = false
        this.submitQuiz();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Question navigation
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      // save question response

    }
  }

  nextQuestion() {
    // Get the current quiz data from the observable
    this.quizSubscription = this.quiz$.subscribe(quiz => {
      if (quiz && this.currentQuestionIndex < quiz.questions.length - 1) {
        this.currentQuestionIndex++;
        // save question response

      }
    });
  }

  // Option selection
  selectOption(optionIndex: number, quizId: string, questionId: string, answer: string) {
    this.selectedOptions[this.currentQuestionIndex] = optionIndex;
    this.quizService.submitAnswer(quizId, questionId, answer).subscribe()
  }
  

  isOptionSelected(optionIndex?: number): boolean {
    if (optionIndex !== undefined) {
      return this.selectedOptions[this.currentQuestionIndex] === optionIndex;
    }
    return this.selectedOptions[this.currentQuestionIndex] !== undefined &&
      this.selectedOptions[this.currentQuestionIndex] !== null;
  }


  getQuestionLoadingState(index: number): boolean {
    return this.loadingStates[index] || false;
  }

  // Submit quiz
   async submitQuiz() {
    try {
      // Convert observable to promise and get the latest quiz value
      const quiz = await this.quiz$.pipe(take(1)).toPromise();
      
      if (this.deactivateSubject) {
        this.confirmationPopup = false;
        this.deactivateSubject.next(true); // Allow navigation
        this.deactivateSubject.complete();
        this.deactivateSubject = null;
      }
      
      if (quiz) {
        // Call your quiz submission logic here
        this.quizService.submitQuiz(quiz._id).subscribe()
        this.leaveQuiz()

      } else {
        console.warn('No quiz available to submit');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }

  calculateScore(quiz: Quiz): number {
    let correctAnswers = 0;

    quiz.questions.forEach((question, index) => {
      const selectedOptionIndex = this.selectedOptions[index];
      if (selectedOptionIndex !== null &&
        selectedOptionIndex !== undefined &&
        question.correctAnswer === question.options[selectedOptionIndex]) {
        correctAnswers++;
      }
    });

    return (correctAnswers / quiz.questions.length) * 100;
  }

  // Admin functionality from verify quiz
  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  }



  isCorrectAnswer(questionIndex: number, option: string): boolean {
    let isCorrect = false;

    this.quizSubscription = this.quiz$.subscribe(quiz => {
      if (quiz && quiz.questions[questionIndex]) {
        isCorrect = quiz.questions[questionIndex].correctAnswer === option;
      }
    });

    return isCorrect;
  }

  trackByQuestionId(index: number, question: QuizQuestion): string {
    return question._id || index.toString();
  }
}